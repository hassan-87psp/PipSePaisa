-- PipSePaisa V313
-- Restrict active Admin tracking/reporting RPCs to signed-in users and service role.
-- Each RPC still performs its own admin authorization check.

revoke execute on function public.psp_admin_ad_leads_v307(integer) from public, anon;
revoke execute on function public.psp_admin_fc2_dashboard_v308(timestamptz, timestamptz, text, integer) from public, anon;
revoke execute on function public.psp_admin_fc2_enrollments_v307(timestamptz, timestamptz, text, integer) from public, anon;
revoke execute on function public.psp_admin_fc2_metrics_v307(timestamptz, timestamptz, text) from public, anon;

grant execute on function public.psp_admin_ad_leads_v307(integer) to authenticated, service_role;
grant execute on function public.psp_admin_fc2_dashboard_v308(timestamptz, timestamptz, text, integer) to authenticated, service_role;
grant execute on function public.psp_admin_fc2_enrollments_v307(timestamptz, timestamptz, text, integer) to authenticated, service_role;
grant execute on function public.psp_admin_fc2_metrics_v307(timestamptz, timestamptz, text) to authenticated, service_role;
