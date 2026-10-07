-- PipSePaisa V487 — retire unused public FreeCourse2 chat-click writer.
revoke all on function public.psp_fc2_chat_click_v304(text,text,text,text,text,text)
  from public,anon,authenticated;
grant execute on function public.psp_fc2_chat_click_v304(text,text,text,text,text,text)
  to service_role;
