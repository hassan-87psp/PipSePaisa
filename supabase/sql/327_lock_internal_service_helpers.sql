
revoke execute on function public.psp_ad_short_client_id_v269(uuid)
  from public, anon, authenticated;
grant execute on function public.psp_ad_short_client_id_v269(uuid)
  to service_role;

revoke execute on function public.psp_fc2_cache_submission_v307(jsonb,text,boolean)
  from public, anon, authenticated;
grant execute on function public.psp_fc2_cache_submission_v307(jsonb,text,boolean)
  to service_role;

revoke execute on function public.psp_finance_daily_maintenance()
  from public, anon, authenticated;
grant execute on function public.psp_finance_daily_maintenance()
  to service_role;

revoke execute on function public.psp_finance_sync_course_revenue_v179(uuid)
  from public, anon, authenticated;
grant execute on function public.psp_finance_sync_course_revenue_v179(uuid)
  to service_role;

revoke execute on function public.psp_finance_sync_partner_payouts(date)
  from public, anon, authenticated;
grant execute on function public.psp_finance_sync_partner_payouts(date)
  to service_role;

revoke execute on function public.psp_sync_course_revenue_v174(uuid)
  from public, anon, authenticated;
grant execute on function public.psp_sync_course_revenue_v174(uuid)
  to service_role;
