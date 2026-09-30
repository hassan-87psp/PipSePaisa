
-- Internal helpers: never callable directly by browser/client roles.
revoke execute on function public.psp_finance_generate_recurring(date) from public, anon, authenticated;
grant execute on function public.psp_finance_generate_recurring(date) to service_role;

revoke execute on function public.psp_internal_ensure_team_free_links_v246(text) from public, anon, authenticated;
grant execute on function public.psp_internal_ensure_team_free_links_v246(text) to service_role;

-- Signed-in/admin-guarded RPCs: remove anonymous execution only.
revoke execute on function public.approve_payment_v2(uuid) from public, anon;
grant execute on function public.approve_payment_v2(uuid) to authenticated, service_role;

revoke execute on function public.reject_payment_v2(uuid) from public, anon;
grant execute on function public.reject_payment_v2(uuid) to authenticated, service_role;

revoke execute on function public.close_support_ticket(uuid) from public, anon;
grant execute on function public.close_support_ticket(uuid) to authenticated, service_role;

revoke execute on function public.psp_backfill_fc2_attributed_v303() from public, anon;
grant execute on function public.psp_backfill_fc2_attributed_v303() to authenticated, service_role;

revoke execute on function public.psp_backfill_freecourse2_history_v302() from public, anon;
grant execute on function public.psp_backfill_freecourse2_history_v302() to authenticated, service_role;

revoke execute on function public.psp_fc2_rebuild_cache_v307() from public, anon;
grant execute on function public.psp_fc2_rebuild_cache_v307() to authenticated, service_role;

revoke execute on function public.psp_fc2_recover_old_v308() from public, anon;
grant execute on function public.psp_fc2_recover_old_v308() to authenticated, service_role;

revoke execute on function public.psp_finance_close_month(date) from public, anon;
grant execute on function public.psp_finance_close_month(date) to authenticated, service_role;

revoke execute on function public.psp_sync_course_revenue_v116(uuid) from public, anon;
grant execute on function public.psp_sync_course_revenue_v116(uuid) to authenticated, service_role;

revoke execute on function public.psp_write_admin_audit(
  text,text,text,text,text,jsonb,jsonb,jsonb,text,text,text,text,text,text,text,text
) from public, anon;
grant execute on function public.psp_write_admin_audit(
  text,text,text,text,text,jsonb,jsonb,jsonb,text,text,text,text,text,text,text,text
) to authenticated, service_role;
