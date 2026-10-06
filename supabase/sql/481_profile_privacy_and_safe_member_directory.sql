-- PipSePaisa V481 — protect full user profiles while preserving community/DM directory UI.

begin;

create or replace function public.psp_member_directory_v481(
  p_ids uuid[] default null,
  p_mentor_id uuid default null,
  p_user_id uuid default null,
  p_member_types text[] default null,
  p_limit integer default 200
)
returns table(
  id uuid,
  full_name text,
  avatar_url text,
  last_seen timestamptz,
  role text,
  member_type text,
  mentor_id uuid
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  return query
  select p.id,p.full_name,p.avatar_url,p.last_seen,p.role,p.member_type,p.mentor_id
  from public.profiles p
  where p.is_active is distinct from false
    and (p_ids is null or p.id = any(p_ids))
    and (p_mentor_id is null or p.mentor_id = p_mentor_id)
    and (p_user_id is null or p.id = p_user_id)
    and (
      p_member_types is null
      or lower(coalesce(p.member_type,'')) = any(p_member_types)
    )
  order by p.last_seen desc nulls last,p.full_name asc nulls last
  limit least(greatest(coalesce(p_limit,200),1),500);
end;
$function$;

revoke all on function public.psp_member_directory_v481(uuid[],uuid,uuid,text[],integer)
from public,anon;
grant execute on function public.psp_member_directory_v481(uuid[],uuid,uuid,text[],integer)
to authenticated,service_role;

alter policy profiles_read_authenticated
on public.profiles
using (
  id = auth.uid()
  or public.psp_can_manage_signals()
);

commit;
