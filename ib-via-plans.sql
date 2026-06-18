-- ============================================================
-- PHASE 2 — PACKAGES, SERVICES, MEMBER TYPE, MULTI-AUDIENCE
-- Run in Supabase SQL Editor (safe to re-run).
-- ============================================================

-- 1) IB requests reuse payment_requests
alter table payment_requests add column if not exists request_type text default 'payment'; -- 'payment' | 'ib'
alter table payment_requests add column if not exists trading_account text;
create index if not exists payment_requests_type_idx on payment_requests(request_type);

-- 2) Package: services included + member type granted
alter table subscription_plans add column if not exists services text;                  -- comma list e.g. 'signal,chart,courses'
alter table subscription_plans add column if not exists member_type text default 'premium'; -- 'premium' | 'vip'

-- 3) User: what they were granted (auto-filled on approval)
alter table profiles add column if not exists services text;        -- comma list granted from package
alter table profiles add column if not exists member_type text;     -- 'premium' | 'vip'

-- 4) Content multi-audience (comma list of member categories that receive it)
alter table charts  add column if not exists audience text default 'all';  -- 'free,premium,vip' etc. ('all' = everyone)
alter table signals add column if not exists audience text;                 -- comma list; null => derive from access_level

-- 5) Approval -> auto-grant member_type + services + premium window
--    Used for BOTH normal payments and IB requests (both carry plan_id).
create or replace function approve_payment_v2(req_id uuid)
returns void language plpgsql security definer as $$
declare r payment_requests; pl subscription_plans; dur int;
begin
  select * into r from payment_requests where id = req_id;
  if not found then raise exception 'Request not found'; end if;
  if not (is_admin() or r.mentor_id = auth.uid()) then raise exception 'Not allowed'; end if;
  select * into pl from subscription_plans where id = r.plan_id;
  dur := coalesce(r.duration_days, 30);
  update payment_requests set status='approved' where id = req_id;
  update profiles set
    is_premium   = true,
    premium_until = (case when premium_until is not null and premium_until > now() then premium_until else now() end) + (dur || ' days')::interval,
    member_type  = coalesce(pl.member_type, member_type, 'premium'),
    services     = coalesce(pl.services, services)
  where id = r.user_id;
end $$;
grant execute on function approve_payment_v2(uuid) to authenticated;

-- reject keeps using existing reject_payment(req_id)


-- 6) Content audience on courses & news
alter table courses    add column if not exists audience text default 'all';
alter table news_posts add column if not exists audience text default 'all';


-- 7) Reject/Revoke (works on pending OR already-approved requests).
--    If the user has no other approved request left, premium is removed.
create or replace function reject_payment_v2(req_id uuid)
returns void language plpgsql security definer as $$
declare r payment_requests; other int;
begin
  select * into r from payment_requests where id = req_id;
  if not found then raise exception 'Request not found'; end if;
  if not (is_admin() or r.mentor_id = auth.uid()) then raise exception 'Not allowed'; end if;
  update payment_requests set status='rejected' where id = req_id;
  select count(*) into other from payment_requests
    where user_id = r.user_id and status='approved' and id <> req_id;
  if other = 0 then
    update profiles set is_premium=false, premium_until=null, member_type=null, services=null
      where id = r.user_id;
  end if;
end $$;
grant execute on function reject_payment_v2(uuid) to authenticated;


-- 8) Make official plans visible to ALL students (additive policy; safe if RLS on)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='subscription_plans' and policyname='subplans_official_public') then
    execute 'create policy subplans_official_public on subscription_plans for select using (is_official = true and is_active = true)';
  end if;
exception when others then null; end $$;

-- done ✅

-- ============================================================
-- SUPPORT MESSAGES + NOTIFICATIONS (admin Messages & Notifications)
-- ============================================================
-- Support tickets: user -> admin, with admin reply
create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text, email text,
  subject text, body text,
  status text default 'open',        -- open | replied
  admin_reply text, replied_at timestamptz,
  created_at timestamptz default now()
);
alter table support_messages enable row level security;
drop policy if exists sm_select on support_messages;
create policy sm_select on support_messages for select using (user_id = auth.uid() or is_admin());
drop policy if exists sm_insert on support_messages;
create policy sm_insert on support_messages for insert with check (user_id = auth.uid());
drop policy if exists sm_update on support_messages;
create policy sm_update on support_messages for update using (is_admin());

-- Notifications: extra fields + read/insert policies
alter table notifications add column if not exists type text default 'general';
alter table notifications add column if not exists action_link text;
alter table notifications add column if not exists audience text default 'all';
alter table notifications enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notif_read_all') then
    execute 'create policy notif_read_all on notifications for select using (is_official = true or owner_id = auth.uid())';
  end if;
exception when others then null; end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notif_admin_ins') then
    execute 'create policy notif_admin_ins on notifications for insert with check (is_admin() or owner_id = auth.uid())';
  end if;
exception when others then null; end $$;
-- done ✅✅

-- Threaded support: mark who sent each message (user/admin)
alter table support_messages add column if not exists sender text default 'user';
