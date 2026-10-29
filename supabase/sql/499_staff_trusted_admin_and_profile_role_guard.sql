-- PipSePaisa V499: Trusted admin allowlist for staff permissions.
-- Existing profiles.role is editable under the legacy profiles_update_own policy.
-- This narrow allowlist prevents escalation of new staff privileges.
create table if not exists public.psp_staff_admins_v499(
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.psp_staff_admins_v499 enable row level security;
revoke all on public.psp_staff_admins_v499 from public,anon,authenticated;
-- Seed only the existing trusted admin account(s) at installation time.
insert into public.psp_staff_admins_v499(user_id)
select id from public.profiles where lower(trim(role)) in ('admin','super_admin','superadmin')
on conflict(user_id) do nothing;

create or replace function public.psp_staff_is_admin_v499()
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
 select 1 from public.psp_staff_admins_v499 a where a.user_id=auth.uid());
$$;
revoke all on function public.psp_staff_is_admin_v499() from public,anon;
grant execute on function public.psp_staff_is_admin_v499() to authenticated;

-- Stop ordinary profile self-edits from creating a new Admin/Mentor role.
-- Trusted backend/auth triggers without a signed-in user are unaffected.
create or replace function public.psp_guard_profile_role_v499()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null and not public.psp_staff_is_admin_v499() then
  if new.role is distinct from old.role then raise exception 'Role changes require an authorized administrator';end if;
 end if;
 return new;
end;$$;
drop trigger if exists psp_guard_profile_role_v499 on public.profiles;
create trigger psp_guard_profile_role_v499 before update of role on public.profiles
for each row execute function public.psp_guard_profile_role_v499();

create or replace function public.psp_staff_can_v498(p_scope text)
returns boolean language sql stable security definer set search_path='' as $$
 select public.psp_staff_is_admin_v499() or exists(
 select 1 from public.psp_staff_access_v498 s where s.user_id=auth.uid() and s.active
 and case p_scope when 'indicator' then s.indicator_review
                  when 'ib' then s.ib_review
                  when 'ib_decide' then s.ib_review and s.ib_decide
                  else false end);
$$;
revoke all on function public.psp_staff_can_v498(text) from public,anon;
grant execute on function public.psp_staff_can_v498(text) to authenticated;

drop policy if exists staff_access_read_v498 on public.psp_staff_access_v498;
create policy staff_access_read_v498 on public.psp_staff_access_v498 for select to authenticated
 using (user_id=(select auth.uid()) or public.psp_staff_is_admin_v499());
drop policy if exists staff_reviews_read_v498 on public.psp_staff_reviews_v498;
create policy staff_reviews_read_v498 on public.psp_staff_reviews_v498 for select to authenticated
 using (actor=(select auth.uid()) or public.psp_staff_is_admin_v499());

create or replace function public.psp_staff_grant_v498(
 p_email text,p_indicator_review boolean,p_ib_review boolean,p_ib_decide boolean,p_active boolean default true)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_id uuid;v_email text;
begin
 if not public.psp_staff_is_admin_v499() then raise exception 'Admin required';end if;
 if not p_ib_review and p_ib_decide then raise exception 'IB decision requires IB review permission';end if;
 select p.id,p.email into v_id,v_email from public.profiles p
 where lower(trim(p.email))=lower(trim(p_email)) limit 1;
 if v_id is null then raise exception 'No existing user matches this email';end if;
 insert into public.psp_staff_access_v498(user_id,indicator_review,ib_review,ib_decide,active,granted_by,updated_at)
 values(v_id,p_indicator_review,p_ib_review,p_ib_decide,p_active,auth.uid(),now())
 on conflict(user_id) do update set indicator_review=excluded.indicator_review,
 ib_review=excluded.ib_review,ib_decide=excluded.ib_decide,active=excluded.active,
 granted_by=excluded.granted_by,updated_at=now();
 return jsonb_build_object('success',true,'email',v_email,'indicator_review',p_indicator_review,'ib_review',p_ib_review,'ib_decide',p_ib_decide,'active',p_active);
end;$$;
revoke all on function public.psp_staff_grant_v498(text,boolean,boolean,boolean,boolean) from public,anon;
grant execute on function public.psp_staff_grant_v498(text,boolean,boolean,boolean,boolean) to authenticated;

create or replace function public.psp_staff_list_v498()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.psp_staff_is_admin_v499() then raise exception 'Admin only';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]'::jsonb) into result
 from(select p.email,p.full_name,s.indicator_review,s.ib_review,s.ib_decide,s.active,s.updated_at
 from public.psp_staff_access_v498 s join public.profiles p on p.id=s.user_id)x;
 return result;
end;$$;
revoke all on function public.psp_staff_list_v498() from public,anon;
grant execute on function public.psp_staff_list_v498() to authenticated;
