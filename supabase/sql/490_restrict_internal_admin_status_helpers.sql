-- PipSePaisa V490 — internal admin-status helpers are not browser RPCs.
-- All known callers are SECURITY DEFINER functions and no frontend direct use exists.

revoke all on function public.psp_profile_is_admin(uuid) from public,anon,authenticated;
revoke all on function public.psp_course_owner_is_admin(uuid) from public,anon,authenticated;

grant execute on function public.psp_profile_is_admin(uuid) to service_role;
grant execute on function public.psp_course_owner_is_admin(uuid) to service_role;
