-- PipSePaisa V342
-- Explicitly document service/internal tables as client-denied while keeping future permissive policies possible.

drop policy if exists "psp_v342_client_deny" on public."account_verification_email_tokens";
create policy "psp_v342_client_deny" on public."account_verification_email_tokens" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_ad_events_v261";
create policy "psp_v342_client_deny" on public."psp_ad_events_v261" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_ad_submissions_v259";
create policy "psp_v342_client_deny" on public."psp_ad_submissions_v259" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_client_manager_override_v281";
create policy "psp_v342_client_deny" on public."psp_client_manager_override_v281" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_client_owner_v273";
create policy "psp_v342_client_deny" on public."psp_client_owner_v273" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_client_transfer_log_v273";
create policy "psp_v342_client_deny" on public."psp_client_transfer_log_v273" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_client_work_v273";
create policy "psp_v342_client_deny" on public."psp_client_work_v273" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_fc2_enrollment_cache_v307";
create policy "psp_v342_client_deny" on public."psp_fc2_enrollment_cache_v307" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_fc2_journeys_v303";
create policy "psp_v342_client_deny" on public."psp_fc2_journeys_v303" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_fc2_metric_cache_v307";
create policy "psp_v342_client_deny" on public."psp_fc2_metric_cache_v307" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_fc2_page_sessions_v303";
create policy "psp_v342_client_deny" on public."psp_fc2_page_sessions_v303" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_freecourse2_events_v300";
create policy "psp_v342_client_deny" on public."psp_freecourse2_events_v300" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_lead_assignments";
create policy "psp_v342_client_deny" on public."psp_lead_assignments" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_lead_system_config_v247";
create policy "psp_v342_client_deny" on public."psp_lead_system_config_v247" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_lead_system_config_v248";
create policy "psp_v342_client_deny" on public."psp_lead_system_config_v248" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_live_chat_conversations";
create policy "psp_v342_client_deny" on public."psp_live_chat_conversations" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_live_chat_events";
create policy "psp_v342_client_deny" on public."psp_live_chat_events" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_live_chat_manager_presence";
create policy "psp_v342_client_deny" on public."psp_live_chat_manager_presence" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_live_chat_messages";
create policy "psp_v342_client_deny" on public."psp_live_chat_messages" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_live_chat_quick_replies";
create policy "psp_v342_client_deny" on public."psp_live_chat_quick_replies" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."psp_team_free_course_links_v246";
create policy "psp_v342_client_deny" on public."psp_team_free_course_links_v246" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."signal_monitor_state";
create policy "psp_v342_client_deny" on public."signal_monitor_state" as permissive for all to anon, authenticated using (false) with check (false);

drop policy if exists "psp_v342_client_deny" on public."team_login_sessions";
create policy "psp_v342_client_deny" on public."team_login_sessions" as permissive for all to anon, authenticated using (false) with check (false);
