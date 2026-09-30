
revoke execute on function public.psp_get_my_access_status() from public, anon;
grant execute on function public.psp_get_my_access_status() to authenticated, service_role;

revoke execute on function public.psp_my_client_identity() from public, anon;
grant execute on function public.psp_my_client_identity() to authenticated, service_role;

revoke execute on function public.psp_my_referral_redirect_target_v76() from public, anon;
grant execute on function public.psp_my_referral_redirect_target_v76() to authenticated, service_role;
