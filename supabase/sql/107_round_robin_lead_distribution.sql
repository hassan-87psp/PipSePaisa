-- ============================================================
-- PipSePaisa V245 — Round-Robin Enrollment Lead Distribution
-- Safe additive migration. Existing team/login/link/course data is preserved.
--
-- Adds:
-- 1) WhatsApp + independent Leads ON/OFF fields on team_members
-- 2) Permanent enrollment -> team lead assignments
-- 3) Concurrency-safe round-robin assignment RPC
-- 4) Admin lead-directory/settings RPCs
-- 5) Team Panel RPC for assigned enrollment leads
-- ============================================================

create extension if not exists pgcrypto;

DO $$
BEGIN
  IF to_regclass('public.team_members') IS NULL THEN
    RAISE EXCEPTION 'public.team_members is missing. Install the existing Team Panel system first.';
  END IF;
  IF to_regclass('public.course_enrollments') IS NULL THEN
    RAISE EXCEPTION 'public.course_enrollments is missing. Install the course enrollment system first.';
  END IF;
END
$$;

-- Lead distribution controls are intentionally separate from Team Panel access.
alter table public.team_members
  add column if not exists whatsapp_number text,
  add column if not exists lead_distribution_enabled boolean not null default true,
  add column if not exists lead_last_assigned_at timestamptz,
  add column if not exists lead_assignment_count bigint not null default 0;

-- Existing Team Members start paused until Admin saves a valid WhatsApp number.
-- New V245-created/edited members are explicitly switched ON by the Admin UI.
update public.team_members
set lead_distribution_enabled = false
where length(regexp_replace(coalesce(whatsapp_number, ''), '[^0-9]', '', 'g')) < 8;

create table if not exists public.psp_lead_assignments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.course_enrollments(id) on delete cascade,
  user_id uuid,
  team_member_id text not null,
  team_member_name text not null,
  team_member_whatsapp text not null,
  course_key text,
  course_name text,
  client_name text,
  client_email text,
  client_whatsapp text,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (enrollment_id)
);

create index if not exists psp_lead_assignments_team_idx
  on public.psp_lead_assignments(team_member_id, assigned_at desc);
create index if not exists psp_lead_assignments_user_idx
  on public.psp_lead_assignments(user_id, assigned_at desc);

alter table public.psp_lead_assignments enable row level security;

-- Direct table reads/writes are not needed; all access is through guarded RPCs.
revoke all on table public.psp_lead_assignments from anon, authenticated;

-- ------------------------------------------------------------
-- Admin: compact lead distribution directory.
-- Uses text IDs so it remains compatible if team_members.id is uuid/text.
-- ------------------------------------------------------------
create or replace function public.psp_admin_team_lead_directory_v245()
returns table (
  team_member_id text,
  whatsapp_number text,
  lead_distribution_enabled boolean,
  assigned_lead_count bigint,
  last_lead_assigned_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.psp_is_admin() then
    raise exception 'Admin access required.';
  end if;

  return query
  select
    t.id::text,
    coalesce(t.whatsapp_number, ''),
    coalesce(t.lead_distribution_enabled, true),
    coalesce((select count(*) from public.psp_lead_assignments a where a.team_member_id = t.id::text), 0)::bigint,
    t.lead_last_assigned_at
  from public.team_members t
  order by lower(coalesce(t.display_name, t.username, t.id::text)), t.id::text;
end;
$$;

revoke all on function public.psp_admin_team_lead_directory_v245() from public;
grant execute on function public.psp_admin_team_lead_directory_v245() to authenticated, service_role;

-- Admin: update WhatsApp + Leads ON/OFF by member id.
create or replace function public.psp_admin_set_team_lead_settings_v245(
  p_team_member_id text,
  p_whatsapp_number text,
  p_lead_distribution_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_digits text;
begin
  if not public.psp_is_admin() then
    raise exception 'Admin access required.';
  end if;

  v_digits := regexp_replace(coalesce(p_whatsapp_number, ''), '[^0-9]', '', 'g');
  if coalesce(p_lead_distribution_enabled, false) and length(v_digits) < 8 then
    raise exception 'Add a valid WhatsApp number before turning Leads ON.';
  end if;

  update public.team_members
  set whatsapp_number = nullif(v_digits, ''),
      lead_distribution_enabled = coalesce(p_lead_distribution_enabled, false)
  where id::text = p_team_member_id;

  if not found then
    raise exception 'Team member not found.';
  end if;
end;
$$;

revoke all on function public.psp_admin_set_team_lead_settings_v245(text,text,boolean) from public;
grant execute on function public.psp_admin_set_team_lead_settings_v245(text,text,boolean) to authenticated, service_role;

-- Admin: same update by username; used immediately after existing V56 account creation.
create or replace function public.psp_admin_set_team_lead_settings_by_username_v245(
  p_username text,
  p_whatsapp_number text,
  p_lead_distribution_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id text;
begin
  if not public.psp_is_admin() then
    raise exception 'Admin access required.';
  end if;

  select t.id::text into v_id
  from public.team_members t
  where lower(trim(coalesce(t.username, ''))) = lower(trim(coalesce(p_username, '')))
  limit 1;

  if v_id is null then
    raise exception 'Team member not found after account creation.';
  end if;

  perform public.psp_admin_set_team_lead_settings_v245(v_id, p_whatsapp_number, p_lead_distribution_enabled);
end;
$$;

revoke all on function public.psp_admin_set_team_lead_settings_by_username_v245(text,text,boolean) from public;
grant execute on function public.psp_admin_set_team_lead_settings_by_username_v245(text,text,boolean) to authenticated, service_role;

-- ------------------------------------------------------------
-- Enrollment assignment.
-- The enrollment row is locked first, so double-clicks/concurrent requests
-- cannot give one enrollment to two people. Eligible team members are chosen
-- by least-recent assignment, producing a fair 1-by-1 round robin.
-- ------------------------------------------------------------
create or replace function public.psp_assign_enrollment_lead_v245(p_enrollment_id uuid)
returns table (
  assignment_id uuid,
  team_member_id text,
  team_member_name text,
  whatsapp_number text,
  enrollment_id uuid,
  client_name text,
  client_email text,
  client_whatsapp text,
  course_key text,
  course_name text,
  assigned_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enrollment public.course_enrollments%rowtype;
  v_member_id text;
  v_member_name text;
  v_member_whatsapp text;
  v_assignment public.psp_lead_assignments%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select e.* into v_enrollment
  from public.course_enrollments e
  where e.id = p_enrollment_id
  for update;

  if not found then
    raise exception 'Enrollment not found.';
  end if;

  if v_enrollment.user_id is distinct from auth.uid() and not public.psp_is_admin() then
    raise exception 'You can only assign your own enrollment.';
  end if;

  -- Idempotent: repeat opens always return the original owner.
  select a.* into v_assignment
  from public.psp_lead_assignments a
  where a.enrollment_id = p_enrollment_id
  limit 1;

  if found then
    return query select
      v_assignment.id,
      v_assignment.team_member_id,
      v_assignment.team_member_name,
      v_assignment.team_member_whatsapp,
      v_assignment.enrollment_id,
      v_assignment.client_name,
      v_assignment.client_email,
      v_assignment.client_whatsapp,
      v_assignment.course_key,
      v_assignment.course_name,
      v_assignment.assigned_at;
    return;
  end if;

  -- Lock one eligible member. OFF members and disabled Team accounts are skipped.
  select
    t.id::text,
    coalesce(nullif(trim(t.display_name), ''), nullif(trim(t.username), ''), 'PipSePaisa Team'),
    regexp_replace(coalesce(t.whatsapp_number, ''), '[^0-9]', '', 'g')
  into v_member_id, v_member_name, v_member_whatsapp
  from public.team_members t
  where coalesce(t.is_active, true) = true
    and coalesce(t.lead_distribution_enabled, true) = true
    and length(regexp_replace(coalesce(t.whatsapp_number, ''), '[^0-9]', '', 'g')) >= 8
  order by t.lead_last_assigned_at asc nulls first, t.id::text asc
  for update of t skip locked
  limit 1;

  -- If nobody is ON, return no rows. Frontend safely uses the old referral/channel fallback.
  if v_member_id is null then
    return;
  end if;

  insert into public.psp_lead_assignments (
    enrollment_id,user_id,team_member_id,team_member_name,team_member_whatsapp,
    course_key,course_name,client_name,client_email,client_whatsapp,assigned_at
  ) values (
    v_enrollment.id,
    v_enrollment.user_id,
    v_member_id,
    v_member_name,
    v_member_whatsapp,
    v_enrollment.course_key,
    v_enrollment.course_name,
    coalesce(nullif(trim(v_enrollment.full_name), ''), split_part(coalesce(v_enrollment.email, ''), '@', 1), 'PipSePaisa Student'),
    coalesce(v_enrollment.email, ''),
    coalesce(v_enrollment.whatsapp, ''),
    clock_timestamp()
  )
  returning * into v_assignment;

  update public.team_members
  set lead_last_assigned_at = v_assignment.assigned_at,
      lead_assignment_count = coalesce(lead_assignment_count, 0) + 1
  where id::text = v_member_id;

  return query select
    v_assignment.id,
    v_assignment.team_member_id,
    v_assignment.team_member_name,
    v_assignment.team_member_whatsapp,
    v_assignment.enrollment_id,
    v_assignment.client_name,
    v_assignment.client_email,
    v_assignment.client_whatsapp,
    v_assignment.course_key,
    v_assignment.course_name,
    v_assignment.assigned_at;
end;
$$;

revoke all on function public.psp_assign_enrollment_lead_v245(uuid) from public;
grant execute on function public.psp_assign_enrollment_lead_v245(uuid) to authenticated, service_role;

-- ------------------------------------------------------------
-- Team session -> team_member_id helper.
-- Reuses the installed V208/V207/V206 Team Panel RPCs, so no auth model is duplicated.
-- ------------------------------------------------------------
create or replace function public.psp_team_member_id_from_session_v245(p_session_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_json jsonb;
  v_id text;
  v_fn text;
  v_month integer := extract(month from (now() at time zone 'Asia/Kuala_Lumpur'))::integer;
  v_year integer := extract(year from (now() at time zone 'Asia/Kuala_Lumpur'))::integer;
begin
  if nullif(trim(coalesce(p_session_token, '')), '') is null then
    return null;
  end if;

  foreach v_fn in array array['psp_team_overview_v208','psp_team_command_center_v207','psp_team_command_center_v206'] loop
    begin
      execute format('select to_jsonb(x) from public.%I(p_session_token => $1, p_month => $2, p_year => $3) x limit 1', v_fn)
        into v_json using p_session_token, v_month, v_year;

      if v_json is not null then
        v_id := nullif(v_json->>'team_member_id', '');
        if v_id is null then
          begin
            v_id := trim(both '"' from coalesce(jsonb_path_query_first(v_json, '$.**.team_member_id')::text, ''));
          exception when others then
            v_id := null;
          end;
        end if;
        if nullif(v_id, '') is not null and lower(v_id) <> 'null' then
          return v_id;
        end if;
      end if;
    exception when others then
      v_json := null;
      v_id := null;
    end;
  end loop;

  return null;
end;
$$;

revoke all on function public.psp_team_member_id_from_session_v245(text) from public;
grant execute on function public.psp_team_member_id_from_session_v245(text) to anon, authenticated, service_role;

-- Assigned leads visible only to the Team Panel session that owns them.
create or replace function public.psp_team_assigned_leads_v245(
  p_session_token text,
  p_limit integer default 1000
)
returns table (
  assignment_id uuid,
  user_id uuid,
  client_id text,
  full_name text,
  email text,
  whatsapp text,
  registration_at timestamptz,
  source text,
  campaign text,
  reference_code text,
  course_enrollment text,
  vip_status text,
  broker text,
  broker_status text,
  account_mode text,
  conversion_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id text;
  v_limit integer := greatest(1, least(coalesce(p_limit, 1000), 2000));
begin
  v_member_id := public.psp_team_member_id_from_session_v245(p_session_token);
  if v_member_id is null then
    raise exception 'Team session is invalid or expired.';
  end if;

  return query
  select
    a.id,
    a.user_id,
    coalesce(p.client_id::text, ''),
    coalesce(nullif(a.client_name, ''), nullif(p.full_name, ''), split_part(coalesce(a.client_email, p.email, ''), '@', 1), 'PipSePaisa Student'),
    coalesce(nullif(a.client_email, ''), p.email, ''),
    coalesce(nullif(a.client_whatsapp, ''), p.whatsapp, p.phone, ''),
    a.assigned_at,
    'Auto Lead'::text,
    'Round Robin'::text,
    ('AUTO-' || upper(substr(replace(a.id::text, '-', ''), 1, 8)))::text,
    coalesce(nullif(a.course_name, ''), nullif(a.course_key, ''), 'Course'),
    'Not VIP'::text,
    null::text,
    null::text,
    null::text,
    'Registered'::text
  from public.psp_lead_assignments a
  left join public.profiles p on p.id = a.user_id
  where a.team_member_id = v_member_id
  order by a.assigned_at desc
  limit v_limit;
end;
$$;

revoke all on function public.psp_team_assigned_leads_v245(text,integer) from public;
grant execute on function public.psp_team_assigned_leads_v245(text,integer) to anon, authenticated, service_role;

-- Keep PostgREST schema cache fresh in Supabase.
notify pgrst, 'reload schema';
