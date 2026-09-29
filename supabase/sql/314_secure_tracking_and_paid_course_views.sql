-- PipSePaisa V314
-- Secure link analytics and paid-course helper views.

alter view public.tracked_link_stats_v211 set (security_invoker = true);
revoke all on public.tracked_link_stats_v211 from public, anon, authenticated;
grant select on public.tracked_link_stats_v211 to service_role;

alter view public.psp_paid_course_team_categories_v221 set (security_invoker = true);
revoke all on public.psp_paid_course_team_categories_v221 from public, anon;
revoke insert, update, delete, truncate, references, trigger
  on public.psp_paid_course_team_categories_v221 from authenticated;
grant select on public.psp_paid_course_team_categories_v221 to authenticated, service_role;

create or replace function public.psp_admin_tracked_link_stats_v314()
returns setof public.tracked_link_stats_v211
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.psp_is_admin()
     and coalesce(current_setting('request.jwt.claim.role', true),'') <> 'service_role' then
    raise exception 'Admin access required';
  end if;

  return query
  select *
  from public.tracked_link_stats_v211
  order by created_at desc;
end
$$;

revoke execute on function public.psp_admin_tracked_link_stats_v314() from public, anon;
grant execute on function public.psp_admin_tracked_link_stats_v314() to authenticated, service_role;
