-- PipSePaisa V483 — retire obsolete public FreeCourse2 analytics write RPCs.
-- No recent production traffic and no current frontend references were found.
-- Current V304 form/enrollment tracking remains available.

begin;

revoke all on function public.psp_fc2_chat_click_v303(text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.psp_fc2_enrollment_v303(text,text) from public,anon,authenticated;
revoke all on function public.psp_fc2_form_open_v303(text,text,text,text) from public,anon,authenticated;
revoke all on function public.psp_fc2_page_open_v303(text,text,text,text) from public,anon,authenticated;
revoke all on function public.psp_track_freecourse2_event_v300(text,text,text,text,text,text,text,text,text,text,jsonb) from public,anon,authenticated;

grant execute on function public.psp_fc2_chat_click_v303(text,text,text,text,text) to service_role;
grant execute on function public.psp_fc2_enrollment_v303(text,text) to service_role;
grant execute on function public.psp_fc2_form_open_v303(text,text,text,text) to service_role;
grant execute on function public.psp_fc2_page_open_v303(text,text,text,text) to service_role;
grant execute on function public.psp_track_freecourse2_event_v300(text,text,text,text,text,text,text,text,text,text,jsonb) to service_role;

commit;
