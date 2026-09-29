-- ============================================================
-- PIPSEPAISA QUERY 46
-- COURSE + PAYMENT + SIGNAL + CHART SCHEMA REPAIR
-- Safe: no existing rows are deleted.
-- ============================================================

create extension if not exists pgcrypto;

-- Missing columns reported by the frontend
alter table public.signals
  add column if not exists closed_at timestamptz;

alter table public.charts
  add column if not exists notes text;

alter table public.payment_methods
  add column if not exists owner_id uuid,
  add column if not exists type text default 'bank',
  add column if not exists label text,
  add column if not exists account_title text,
  add column if not exists account_number text,
  add column if not exists bank_name text,
  add column if not exists wallet text,
  add column if not exists network text,
  add column if not exists enabled boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.courses
  add column if not exists premium_plan_id uuid;

alter table public.payment_requests
  add column if not exists mentor_id uuid;

-- Defaults
alter table public.payment_methods
  alter column owner_id set default auth.uid(),
  alter column enabled set default true,
  alter column created_at set default now(),
  alter column updated_at set default now();

update public.payment_methods
set enabled=coalesce(enabled,true),
    created_at=coalesce(created_at,now()),
    updated_at=coalesce(updated_at,now());

-- Foreign keys, added only when safe
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='payment_methods_owner_id_fkey'
      and conrelid='public.payment_methods'::regclass
  ) then
    begin
      alter table public.payment_methods
      add constraint payment_methods_owner_id_fkey
      foreign key(owner_id) references public.profiles(id)
      on update cascade on delete set null;
    exception when foreign_key_violation then
      raise notice 'payment_methods owner foreign key skipped because old invalid values exist.';
    end;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='courses_premium_plan_id_fkey'
      and conrelid='public.courses'::regclass
  ) then
    begin
      alter table public.courses
      add constraint courses_premium_plan_id_fkey
      foreign key(premium_plan_id) references public.subscription_plans(id)
      on update cascade on delete set null;
    exception when datatype_mismatch or foreign_key_violation then
      raise notice 'courses premium_plan_id foreign key skipped.';
    end;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='payment_requests_mentor_id_fkey'
      and conrelid='public.payment_requests'::regclass
  ) then
    begin
      alter table public.payment_requests
      add constraint payment_requests_mentor_id_fkey
      foreign key(mentor_id) references public.profiles(id)
      on update cascade on delete set null;
    exception when foreign_key_violation then
      raise notice 'payment_requests mentor foreign key skipped because old invalid values exist.';
    end;
  end if;
end $$;

create index if not exists payment_methods_owner_idx on public.payment_methods(owner_id);
create index if not exists payment_methods_enabled_idx on public.payment_methods(enabled);
create index if not exists payment_requests_mentor_idx on public.payment_requests(mentor_id);
create index if not exists signals_closed_at_idx on public.signals(closed_at);

-- Payment methods RLS: admins/owners manage, users can read enabled methods
alter table public.payment_methods enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname='public' and tablename='payment_methods'
  loop
    execute format('drop policy if exists %I on public.payment_methods',p.policyname);
  end loop;
end $$;

create policy "Authenticated users view enabled payment methods"
on public.payment_methods for select to authenticated
using (
  enabled=true
  or owner_id=auth.uid()
  or public.psp_is_admin()
);

create policy "Admins and owners create payment methods"
on public.payment_methods for insert to authenticated
with check (
  owner_id=auth.uid()
  or public.psp_is_admin()
);

create policy "Admins and owners update payment methods"
on public.payment_methods for update to authenticated
using (owner_id=auth.uid() or public.psp_is_admin())
with check (owner_id=auth.uid() or public.psp_is_admin());

create policy "Admins and owners delete payment methods"
on public.payment_methods for delete to authenticated
using (owner_id=auth.uid() or public.psp_is_admin());

grant select,insert,update,delete on public.payment_methods to authenticated;
grant all on public.payment_methods to service_role;

notify pgrst, 'reload schema';

select 'signals.closed_at' component,
       case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='signals' and column_name='closed_at') then '✅ READY' else '❌ MISSING' end status
union all
select 'charts.notes',
       case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='charts' and column_name='notes') then '✅ READY' else '❌ MISSING' end
union all
select 'payment_methods.owner_id',
       case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='payment_methods' and column_name='owner_id') then '✅ READY' else '❌ MISSING' end
union all
select 'courses.premium_plan_id',
       case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='courses' and column_name='premium_plan_id') then '✅ READY' else '❌ MISSING' end
union all
select 'payment_requests.mentor_id',
       case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='payment_requests' and column_name='mentor_id') then '✅ READY' else '❌ MISSING' end;
