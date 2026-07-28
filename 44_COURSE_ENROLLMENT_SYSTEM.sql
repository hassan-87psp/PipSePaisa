-- ============================================================
-- PIPSEPAISA
-- QUERY 44 — COURSE ENROLLMENT SYSTEM
--
-- Adds:
-- 1. Free and paid course enrollment tracking
-- 2. Payment-verification status for paid course
-- 3. User self-service RLS
-- 4. Admin approval/rejection access
-- 5. Realtime updates
--
-- Existing data is not deleted.
-- ============================================================

create extension if not exists pgcrypto;

-- Required tables
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'public.profiles table is missing.';
  END IF;
END
$$;

-- Admin helper (safe to re-run)
create or replace function public.psp_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role::text, '')) in (
        'admin', 'super_admin', 'superadmin'
      )
  );
$$;

revoke all on function public.psp_is_admin() from public;
grant execute on function public.psp_is_admin() to authenticated, service_role;

-- Enrollment table
create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null default auth.uid()
    references public.profiles(id)
    on update cascade
    on delete cascade,

  course_key text not null,
  course_name text not null,
  course_type text not null default 'free',
  price numeric(15,2) not null default 0,
  currency text not null default 'USD',

  full_name text,
  email text,
  whatsapp text,
  experience text,
  learning_goal text,

  payment_method text,
  transaction_id text,
  receipt_url text,

  payment_status text not null default 'not_required',
  enrollment_status text not null default 'pending',
  access_granted_at timestamptz,

  reviewed_by uuid
    references public.profiles(id)
    on update cascade
    on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, course_key),

  constraint course_enrollments_course_key_check
    check (course_key in ('basic', 'advanced')),
  constraint course_enrollments_course_type_check
    check (course_type in ('free', 'paid')),
  constraint course_enrollments_payment_status_check
    check (payment_status in ('not_required', 'pending', 'approved', 'rejected')),
  constraint course_enrollments_status_check
    check (enrollment_status in ('pending', 'enrolled', 'rejected', 'cancelled')),
  constraint course_enrollments_price_check
    check (price >= 0)
);

-- Complete a partially-created table safely
alter table public.course_enrollments
  add column if not exists user_id uuid,
  add column if not exists course_key text,
  add column if not exists course_name text,
  add column if not exists course_type text default 'free',
  add column if not exists price numeric(15,2) default 0,
  add column if not exists currency text default 'USD',
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists whatsapp text,
  add column if not exists experience text,
  add column if not exists learning_goal text,
  add column if not exists payment_method text,
  add column if not exists transaction_id text,
  add column if not exists receipt_url text,
  add column if not exists payment_status text default 'not_required',
  add column if not exists enrollment_status text default 'pending',
  add column if not exists access_granted_at timestamptz,
  add column if not exists reviewed_by uuid,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.course_enrollments
  alter column user_id set default auth.uid(),
  alter column course_type set default 'free',
  alter column price set default 0,
  alter column currency set default 'USD',
  alter column payment_status set default 'not_required',
  alter column enrollment_status set default 'pending',
  alter column created_at set default now(),
  alter column updated_at set default now();

create unique index if not exists course_enrollments_user_course_uidx
  on public.course_enrollments(user_id, course_key);
create index if not exists course_enrollments_user_idx
  on public.course_enrollments(user_id);
create index if not exists course_enrollments_type_status_idx
  on public.course_enrollments(course_type, enrollment_status, created_at desc);
create index if not exists course_enrollments_payment_idx
  on public.course_enrollments(payment_status, created_at desc);


-- Foreign keys for a partially-created table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='course_enrollments_user_id_fkey'
      AND conrelid='public.course_enrollments'::regclass
  ) THEN
    BEGIN
      ALTER TABLE public.course_enrollments
        ADD CONSTRAINT course_enrollments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id)
        ON UPDATE CASCADE ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN foreign_key_violation THEN
        RAISE NOTICE 'Invalid old enrollment user IDs exist; user foreign key skipped.';
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='course_enrollments_reviewed_by_fkey'
      AND conrelid='public.course_enrollments'::regclass
  ) THEN
    BEGIN
      ALTER TABLE public.course_enrollments
        ADD CONSTRAINT course_enrollments_reviewed_by_fkey
        FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN foreign_key_violation THEN
        RAISE NOTICE 'Invalid old reviewer IDs exist; reviewer foreign key skipped.';
    END;
  END IF;
END
$$;

-- Make the new User Panel tab manageable from site settings when available
DO $$
BEGIN
  IF to_regclass('public.site_settings') IS NOT NULL THEN
    INSERT INTO public.site_settings(key, enabled, description)
    VALUES ('mycourses', true, 'My Courses enrollment and access status')
    ON CONFLICT (key) DO NOTHING;
  END IF;
END
$$;

-- Canonical preparation and permission trigger
create or replace function public.psp_prepare_course_enrollment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if tg_op = 'INSERT' then
    if not public.psp_is_admin() then
      new.user_id := auth.uid();
    elsif new.user_id is null then
      new.user_id := auth.uid();
    end if;

    new.course_key := lower(trim(coalesce(new.course_key, '')));

    if new.course_key = 'basic' then
      new.course_name := 'Basic Forex Course';
      new.course_type := 'free';
      new.price := 0;
      new.currency := 'USD';
      new.payment_status := 'not_required';
      new.enrollment_status := 'enrolled';
      new.access_granted_at := coalesce(new.access_granted_at, now());
      new.reviewed_by := null;
      new.reviewed_at := null;
      new.rejection_reason := null;

    elsif new.course_key = 'advanced' then
      new.course_name := 'Advanced Forex Course';
      new.course_type := 'paid';
      new.price := 200;
      new.currency := 'USD';
      new.payment_status := 'pending';
      new.enrollment_status := 'pending';
      new.access_granted_at := null;
      new.reviewed_by := null;
      new.reviewed_at := null;
      new.rejection_reason := null;

      if nullif(trim(coalesce(new.payment_method, '')), '') is null then
        raise exception 'Payment method is required for the Advanced Course.';
      end if;
      if nullif(trim(coalesce(new.transaction_id, '')), '') is null then
        raise exception 'Transaction ID is required for the Advanced Course.';
      end if;
      if nullif(trim(coalesce(new.receipt_url, '')), '') is null then
        raise exception 'Payment receipt is required for the Advanced Course.';
      end if;
    else
      raise exception 'Invalid course key.';
    end if;

    new.created_at := coalesce(new.created_at, now());

  else
    new.user_id := old.user_id;
    new.course_key := old.course_key;
    new.course_name := old.course_name;
    new.course_type := old.course_type;
    new.price := old.price;
    new.currency := old.currency;
    new.created_at := old.created_at;

    if public.psp_is_admin() then
      new.payment_status := case
        when lower(coalesce(new.payment_status, '')) in ('not_required','pending','approved','rejected')
          then lower(new.payment_status)
        else old.payment_status
      end;
      new.enrollment_status := case
        when lower(coalesce(new.enrollment_status, '')) in ('pending','enrolled','rejected','cancelled')
          then lower(new.enrollment_status)
        else old.enrollment_status
      end;

      if new.enrollment_status = 'enrolled' then
        new.access_granted_at := coalesce(new.access_granted_at, now());
      elsif new.enrollment_status in ('pending','rejected','cancelled') then
        new.access_granted_at := null;
      end if;

      if new.payment_status in ('approved','rejected')
         or new.enrollment_status in ('enrolled','rejected') then
        new.reviewed_by := auth.uid();
        new.reviewed_at := now();
      end if;
    else
      -- Users may update submitted details, but may not approve themselves.
      if old.user_id <> auth.uid() then
        raise exception 'You cannot update this enrollment.';
      end if;
      new.payment_status := old.payment_status;
      new.enrollment_status := old.enrollment_status;
      new.access_granted_at := old.access_granted_at;
      new.reviewed_by := old.reviewed_by;
      new.reviewed_at := old.reviewed_at;
      new.rejection_reason := old.rejection_reason;
    end if;
  end if;

  new.full_name := nullif(trim(coalesce(new.full_name, '')), '');
  new.email := lower(nullif(trim(coalesce(new.email, '')), ''));
  new.whatsapp := nullif(trim(coalesce(new.whatsapp, '')), '');
  new.experience := nullif(trim(coalesce(new.experience, '')), '');
  new.learning_goal := nullif(trim(coalesce(new.learning_goal, '')), '');
  new.payment_method := nullif(trim(coalesce(new.payment_method, '')), '');
  new.transaction_id := nullif(trim(coalesce(new.transaction_id, '')), '');
  new.receipt_url := nullif(trim(coalesce(new.receipt_url, '')), '');
  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists course_enrollments_prepare_before_save
  on public.course_enrollments;
create trigger course_enrollments_prepare_before_save
before insert or update on public.course_enrollments
for each row execute function public.psp_prepare_course_enrollment();

-- RLS
alter table public.course_enrollments enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname='public' and tablename='course_enrollments'
  loop
    execute format('drop policy if exists %I on public.course_enrollments', p.policyname);
  end loop;
end
$$;

create policy "Users view own course enrollments"
on public.course_enrollments
for select to authenticated
using (user_id = auth.uid() or public.psp_is_admin());

create policy "Users submit own course enrollments"
on public.course_enrollments
for insert to authenticated
with check (user_id = auth.uid() or public.psp_is_admin());

create policy "Users update own pending enrollment details"
on public.course_enrollments
for update to authenticated
using (user_id = auth.uid() or public.psp_is_admin())
with check (user_id = auth.uid() or public.psp_is_admin());

create policy "Admins delete course enrollments"
on public.course_enrollments
for delete to authenticated
using (public.psp_is_admin());

revoke all on table public.course_enrollments from anon;
revoke all on table public.course_enrollments from authenticated;
grant select, insert, update on table public.course_enrollments to authenticated;
grant all on table public.course_enrollments to service_role;

-- Realtime
DO $$
BEGIN
  IF EXISTS (select 1 from pg_publication where pubname='supabase_realtime')
     AND NOT EXISTS (
       select 1 from pg_publication_tables
       where pubname='supabase_realtime'
         and schemaname='public'
         and tablename='course_enrollments'
     ) THEN
    alter publication supabase_realtime add table public.course_enrollments;
  END IF;
END
$$;

notify pgrst, 'reload schema';

select
  'course_enrollments table' as component,
  case when to_regclass('public.course_enrollments') is not null
    then '✅ INSTALLED' else '❌ MISSING' end as status
union all
select
  'course_enrollments realtime',
  case when exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='course_enrollments'
  ) then '✅ ENABLED' else '⚠️ NOT ENABLED' end
union all
select
  'My Courses site setting',
  case
    when to_regclass('public.site_settings') is null then '— SITE SETTINGS NOT INSTALLED'
    when exists (select 1 from public.site_settings where key='mycourses') then '✅ READY'
    else '⚠️ MISSING'
  end;
