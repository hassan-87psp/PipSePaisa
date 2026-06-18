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

-- done ✅
