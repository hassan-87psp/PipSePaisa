
revoke execute on function public.psp_backfill_freecourse2_history_v301() from public, anon;
grant execute on function public.psp_backfill_freecourse2_history_v301() to authenticated, service_role;

revoke execute on function public.psp_finance_account_balances() from public, anon;
grant execute on function public.psp_finance_account_balances() to authenticated, service_role;

revoke execute on function public.psp_is_service_role() from public, anon;
grant execute on function public.psp_is_service_role() to authenticated, service_role;

revoke execute on function public.psp_review_access_verification(uuid,text,text) from public, anon;
grant execute on function public.psp_review_access_verification(uuid,text,text) to authenticated, service_role;
