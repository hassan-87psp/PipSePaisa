
revoke execute on function public.psp_finance_prepare_salaries(date)
  from public, anon, authenticated;
grant execute on function public.psp_finance_prepare_salaries(date)
  to service_role;

revoke execute on function public.psp_generate_client_id()
  from public, anon, authenticated;
grant execute on function public.psp_generate_client_id()
  to service_role;

revoke execute on function public.psp_generate_unique_access_pin()
  from public, anon, authenticated;
grant execute on function public.psp_generate_unique_access_pin()
  to service_role;

revoke execute on function public.psp_link_team_for_user_v281(uuid)
  from public, anon, authenticated;
grant execute on function public.psp_link_team_for_user_v281(uuid)
  to service_role;

revoke execute on function public.psp_live_chat_ai_handoff(uuid,text)
  from public, anon, authenticated;
grant execute on function public.psp_live_chat_ai_handoff(uuid,text)
  to service_role;

revoke execute on function public.psp_live_chat_ai_store_reply(uuid,bigint,text)
  from public, anon, authenticated;
grant execute on function public.psp_live_chat_ai_store_reply(uuid,bigint,text)
  to service_role;

revoke execute on function public.psp_live_chat_assert_actor(text)
  from public, anon, authenticated;
grant execute on function public.psp_live_chat_assert_actor(text)
  to service_role;

revoke execute on function public.psp_live_chat_auto_assign(uuid)
  from public, anon, authenticated;
grant execute on function public.psp_live_chat_auto_assign(uuid)
  to service_role;

revoke execute on function public.psp_pin_expiry(timestamptz)
  from public, anon, authenticated;
grant execute on function public.psp_pin_expiry(timestamptz)
  to service_role;

revoke execute on function public.psp_user_registration_at_v205(uuid,timestamptz)
  from public, anon, authenticated;
grant execute on function public.psp_user_registration_at_v205(uuid,timestamptz)
  to service_role;
