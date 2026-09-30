
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

revoke execute on function public.is_mentor_or_admin() from public, anon;
grant execute on function public.is_mentor_or_admin() to authenticated, service_role;

revoke execute on function public.psp_can_manage_post(uuid) from public, anon;
grant execute on function public.psp_can_manage_post(uuid) to authenticated, service_role;

revoke execute on function public.psp_eai_is_admin() from public, anon;
grant execute on function public.psp_eai_is_admin() to authenticated, service_role;

revoke execute on function public.psp_email_is_admin() from public, anon;
grant execute on function public.psp_email_is_admin() to authenticated, service_role;

revoke execute on function public.psp_finance_is_admin() from public, anon;
grant execute on function public.psp_finance_is_admin() to authenticated, service_role;

revoke execute on function public.psp_group_can_manage(uuid) from public, anon;
grant execute on function public.psp_group_can_manage(uuid) to authenticated, service_role;

revoke execute on function public.psp_group_can_post(uuid) from public, anon;
grant execute on function public.psp_group_can_post(uuid) to authenticated, service_role;

revoke execute on function public.psp_group_can_view(uuid) from public, anon;
grant execute on function public.psp_group_can_view(uuid) to authenticated, service_role;

revoke execute on function public.psp_has_content_access() from public, anon;
grant execute on function public.psp_has_content_access() to authenticated, service_role;

revoke execute on function public.psp_is_admin() from public, anon;
grant execute on function public.psp_is_admin() to authenticated, service_role;

revoke execute on function public.psp_is_psp_mentor() from public, anon;
grant execute on function public.psp_is_psp_mentor() to authenticated, service_role;

revoke execute on function public.psp_my_mentor_id() from public, anon;
grant execute on function public.psp_my_mentor_id() to authenticated, service_role;

revoke execute on function public.psp_notification_matches_user(uuid,text) from public, anon;
grant execute on function public.psp_notification_matches_user(uuid,text) to authenticated, service_role;

revoke execute on function public.psp_signal_user_has_access() from public, anon;
grant execute on function public.psp_signal_user_has_access() to authenticated, service_role;
