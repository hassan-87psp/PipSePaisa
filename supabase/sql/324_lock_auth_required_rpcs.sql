
revoke execute on function public.enroll_course_v2(text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.enroll_course_v2(text,text,text,text,text,text,text,text) to authenticated, service_role;

revoke execute on function public.psp_activate_my_access_pin(text) from public, anon;
grant execute on function public.psp_activate_my_access_pin(text) to authenticated, service_role;

revoke execute on function public.psp_assign_enrollment_lead_v245(uuid) from public, anon;
grant execute on function public.psp_assign_enrollment_lead_v245(uuid) to authenticated, service_role;

revoke execute on function public.psp_get_access_expiry_v116() from public, anon;
grant execute on function public.psp_get_access_expiry_v116() to authenticated, service_role;

revoke execute on function public.psp_get_access_status() from public, anon;
grant execute on function public.psp_get_access_status() to authenticated, service_role;

revoke execute on function public.psp_submit_access_verification(text,text,numeric,text,text,text,boolean) from public, anon;
grant execute on function public.psp_submit_access_verification(text,text,numeric,text,text,text,boolean) to authenticated, service_role;

revoke execute on function public.psp_submit_access_verification(text,text,numeric,text,boolean) from public, anon;
grant execute on function public.psp_submit_access_verification(text,text,numeric,text,boolean) to authenticated, service_role;

revoke execute on function public.psp_team_my_clients(integer) from public, anon;
grant execute on function public.psp_team_my_clients(integer) to authenticated, service_role;

revoke execute on function public.psp_team_my_dashboard() from public, anon;
grant execute on function public.psp_team_my_dashboard() to authenticated, service_role;
