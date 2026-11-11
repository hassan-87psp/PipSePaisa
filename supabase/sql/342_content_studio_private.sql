-- PipSePaisa private Content Studio (source-of-truth for deploy/recovery).
-- Live Supabase migration: content_studio_private_permissions_v1 + schedule field + FK indexes.
-- Access is opt-in per user; ordinary VIP/course status never grants permission.
begin;

create table if not exists public.psp_content_access(
 user_id uuid primary key references auth.users(id) on delete cascade,
 permission text not null default 'viewer' check (permission in ('viewer','creator','editor','approver')),
 enabled boolean not null default false,
 granted_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists psp_content_access_granted_by_idx on public.psp_content_access(granted_by);
alter table public.psp_content_access enable row level security;
revoke all on public.psp_content_access from anon;
grant select,insert,update,delete on public.psp_content_access to authenticated;
drop policy if exists psp_content_access_read_v1 on public.psp_content_access;
create policy psp_content_access_read_v1 on public.psp_content_access for select to authenticated
 using(user_id=(select auth.uid()) or (select public.is_mentor_or_admin()));
drop policy if exists psp_content_access_insert_v1 on public.psp_content_access;
create policy psp_content_access_insert_v1 on public.psp_content_access for insert to authenticated
 with check((select public.is_mentor_or_admin()));
drop policy if exists psp_content_access_update_v1 on public.psp_content_access;
create policy psp_content_access_update_v1 on public.psp_content_access for update to authenticated
 using((select public.is_mentor_or_admin())) with check((select public.is_mentor_or_admin()));
drop policy if exists psp_content_access_delete_v1 on public.psp_content_access;
create policy psp_content_access_delete_v1 on public.psp_content_access for delete to authenticated
 using((select public.is_mentor_or_admin()));

create or replace function public.psp_content_permission_v1() returns text
 language sql stable security definer set search_path='' as $fn$
 select a.permission from public.psp_content_access a
 where a.user_id=(select auth.uid()) and a.enabled=true limit 1
 $fn$;
revoke all on function public.psp_content_permission_v1() from public,anon;
grant execute on function public.psp_content_permission_v1() to authenticated;

create or replace function public.psp_content_has_access_v1() returns boolean
 language sql stable security definer set search_path='' as $fn$
 select exists(select 1 from public.psp_content_access a
 where a.user_id=(select auth.uid()) and a.enabled=true)
 $fn$;
revoke all on function public.psp_content_has_access_v1() from public,anon;
grant execute on function public.psp_content_has_access_v1() to authenticated;

create table if not exists public.psp_content_scripts(
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 source_title text not null,
 source_description text not null default '',
 source_name text not null default '',
 source_url text not null default '',
 source_date timestamptz,
 category text not null default 'Market News',
 heat text not null default 'warm',
 duration_seconds integer not null default 60 check(duration_seconds in(30,60,180,480)),
 language text not null default 'Roman Urdu + English',
 tone text not null default 'Professional & Engaging',
 platform text not null default 'Facebook Reels',
 hook text not null default '',
 explanation text not null default '',
 market_impact text not null default '',
 closing text not null default '',
 cta text not null default '',
 seo_title text not null default '',
 caption text not null default '',
 hashtags text not null default '',
 status text not null default 'draft' check(status in('draft','review','approved','published')),
 approved_by uuid references auth.users(id),
 published_url text not null default '',
 scheduled_for timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.psp_content_scripts add column if not exists scheduled_for timestamptz;
create index if not exists psp_content_scripts_updated_idx on public.psp_content_scripts(updated_at desc);
create index if not exists psp_content_scripts_schedule_idx on public.psp_content_scripts(scheduled_for) where scheduled_for is not null;
create index if not exists psp_content_scripts_created_by_idx on public.psp_content_scripts(created_by);
create index if not exists psp_content_scripts_approved_by_idx on public.psp_content_scripts(approved_by);
alter table public.psp_content_scripts enable row level security;
revoke all on public.psp_content_scripts from anon;
grant select,insert,update,delete on public.psp_content_scripts to authenticated;
drop policy if exists psp_content_scripts_read_v1 on public.psp_content_scripts;
create policy psp_content_scripts_read_v1 on public.psp_content_scripts for select to authenticated
 using((select public.psp_content_has_access_v1()));
drop policy if exists psp_content_scripts_insert_v1 on public.psp_content_scripts;
create policy psp_content_scripts_insert_v1 on public.psp_content_scripts for insert to authenticated
 with check(created_by=(select auth.uid()) and status='draft'
 and (select public.psp_content_permission_v1()) in('creator','editor','approver'));
drop policy if exists psp_content_scripts_update_v1 on public.psp_content_scripts;
create policy psp_content_scripts_update_v1 on public.psp_content_scripts for update to authenticated
 using((select public.psp_content_permission_v1()) in('editor','approver') or
  ((select public.psp_content_permission_v1())='creator' and created_by=(select auth.uid()) and status in('draft','review')))
 with check((select public.psp_content_permission_v1()) in('editor','approver') or
  ((select public.psp_content_permission_v1())='creator' and created_by=(select auth.uid()) and status in('draft','review')));
drop policy if exists psp_content_scripts_delete_v1 on public.psp_content_scripts;
create policy psp_content_scripts_delete_v1 on public.psp_content_scripts for delete to authenticated
 using((select public.psp_content_permission_v1())='approver');

create or replace function public.psp_content_scripts_guard_v1() returns trigger
 language plpgsql set search_path='' as $fn$
 declare v_permission text;
 begin
   v_permission:=public.psp_content_permission_v1();
   if new.created_by is distinct from old.created_by then raise exception 'Owner cannot be changed'; end if;
   if old.status in('approved','published') and v_permission <> 'approver' then raise exception 'Approved content can only be changed by an approver'; end if;
   if new.status in('approved','published') and v_permission <> 'approver' then raise exception 'Approval requires approver access'; end if;
   if new.status='published' and old.status not in('approved','published') then raise exception 'Only approved scripts can be published'; end if;
   if new.status='approved' and old.status<>'approved' then new.approved_by:=auth.uid(); end if;
   new.updated_at:=now();
   return new;
 end $fn$;
drop trigger if exists psp_content_script_guard_v1 on public.psp_content_scripts;
create trigger psp_content_script_guard_v1 before update on public.psp_content_scripts
 for each row execute function public.psp_content_scripts_guard_v1();
revoke all on function public.psp_content_scripts_guard_v1() from public,anon,authenticated;

create or replace function public.psp_content_search_users_v1(p_search text default '',p_limit integer default 25)
returns table(user_id uuid,full_name text,email text,permission text,enabled boolean)
 language plpgsql stable security definer set search_path='' as $fn$
 begin
   if not public.is_mentor_or_admin() then raise exception 'Not authorized'; end if;
   return query
   select p.id,p.full_name,p.email,a.permission,coalesce(a.enabled,false)
   from public.profiles p left join public.psp_content_access a on a.user_id=p.id
   where length(trim(coalesce(p_search,'')))=0
      or p.full_name ilike '%'||left(trim(p_search),80)||'%'
      or p.email ilike '%'||left(trim(p_search),80)||'%'
   order by coalesce(a.enabled,false) desc,p.created_at desc
   limit least(greatest(coalesce(p_limit,25),1),50);
 end $fn$;
revoke all on function public.psp_content_search_users_v1(text,integer) from public,anon;
grant execute on function public.psp_content_search_users_v1(text,integer) to authenticated;

create or replace function public.psp_content_set_access_v1(p_user_id uuid,p_permission text,p_enabled boolean)
returns boolean language plpgsql security definer set search_path='' as $fn$
 begin
   if not public.is_mentor_or_admin() then raise exception 'Not authorized'; end if;
   if p_permission not in('viewer','creator','editor','approver') then raise exception 'Invalid permission'; end if;
   if not exists(select 1 from public.profiles p where p.id=p_user_id) then raise exception 'User not found'; end if;
   insert into public.psp_content_access(user_id,permission,enabled,granted_by)
     values(p_user_id,p_permission,coalesce(p_enabled,false),auth.uid())
   on conflict(user_id) do update set permission=excluded.permission,enabled=excluded.enabled,
   granted_by=excluded.granted_by,updated_at=now();
   return true;
 end $fn$;
revoke all on function public.psp_content_set_access_v1(uuid,text,boolean) from public,anon;
grant execute on function public.psp_content_set_access_v1(uuid,text,boolean) to authenticated;
commit;
