-- ============================================================
-- IB PROGRAM (Phase 2)  — run in Supabase SQL Editor
-- Requires existing helper functions: is_admin(), my_mentor_id()
-- (created earlier in schema-v2-mentor-system.sql)
-- ============================================================

-- 1) profile flags ------------------------------------------------
alter table profiles add column if not exists is_ib boolean default false;
alter table profiles add column if not exists ib_approved_at timestamptz;

-- 2) partner brokers (configured by mentor / admin) ---------------
create table if not exists ib_brokers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  is_official boolean default false,        -- true = visible to all students (admin)
  name text not null,
  logo_emoji text default '🤝',
  registration_link text,                   -- IB referral / signup link
  min_deposit numeric default 0,
  currency text default 'USD',
  benefits text,                            -- newline separated bullet points
  instructions text,
  enabled boolean default true,
  display_order int default 0,
  created_at timestamptz default now()
);

-- 3) student IB registrations -------------------------------------
create table if not exists ib_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  mentor_id uuid references profiles(id) on delete set null,
  broker_id uuid references ib_brokers(id) on delete set null,
  broker_name text,
  trading_account text,
  deposit_amount numeric,
  currency text,
  proof_url text,
  notes text,
  status text default 'pending',            -- pending / approved / rejected
  reject_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- 4) RLS ----------------------------------------------------------
alter table ib_brokers enable row level security;
alter table ib_registrations enable row level security;

-- Brokers: students see official OR their mentor's; owner & admin see own/all
drop policy if exists ib_brokers_select on ib_brokers;
create policy ib_brokers_select on ib_brokers for select using (
  (enabled = true and (is_official = true or owner_id = my_mentor_id()))
  or owner_id = auth.uid()
  or is_admin()
);
drop policy if exists ib_brokers_ins on ib_brokers;
create policy ib_brokers_ins on ib_brokers for insert
  with check (owner_id = auth.uid() or is_admin());
drop policy if exists ib_brokers_upd on ib_brokers;
create policy ib_brokers_upd on ib_brokers for update
  using (owner_id = auth.uid() or is_admin());
drop policy if exists ib_brokers_del on ib_brokers;
create policy ib_brokers_del on ib_brokers for delete
  using (owner_id = auth.uid() or is_admin());

-- Registrations: student manages own; their mentor & admin can review
drop policy if exists ib_reg_select on ib_registrations;
create policy ib_reg_select on ib_registrations for select using (
  user_id = auth.uid() or mentor_id = auth.uid() or is_admin()
);
drop policy if exists ib_reg_ins on ib_registrations;
create policy ib_reg_ins on ib_registrations for insert
  with check (user_id = auth.uid());
drop policy if exists ib_reg_upd on ib_registrations;
create policy ib_reg_upd on ib_registrations for update
  using (mentor_id = auth.uid() or is_admin());

-- 5) approve / reject functions ----------------------------------
create or replace function approve_ib(req_id uuid)
returns void language plpgsql security definer as $$
declare r ib_registrations;
begin
  select * into r from ib_registrations where id = req_id;
  if not found then raise exception 'Request not found'; end if;
  if not (is_admin() or r.mentor_id = auth.uid()) then
    raise exception 'Not allowed';
  end if;
  update ib_registrations
    set status='approved', reviewed_by=auth.uid(), reviewed_at=now()
    where id=req_id;
  update profiles
    set is_ib=true, ib_approved_at=now()
    where id=r.user_id;
end $$;

create or replace function reject_ib(req_id uuid, reason text default null)
returns void language plpgsql security definer as $$
declare r ib_registrations;
begin
  select * into r from ib_registrations where id = req_id;
  if not found then raise exception 'Request not found'; end if;
  if not (is_admin() or r.mentor_id = auth.uid()) then
    raise exception 'Not allowed';
  end if;
  update ib_registrations
    set status='rejected', reject_reason=reason,
        reviewed_by=auth.uid(), reviewed_at=now()
    where id=req_id;
end $$;

grant execute on function approve_ib(uuid) to authenticated;
grant execute on function reject_ib(uuid, text) to authenticated;

-- done ✅
