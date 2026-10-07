-- PipSePaisa V485 — retire direct browser execution of the legacy
-- email-verification SQL RPC. The public verification page now calls the
-- confirm-account-verification Edge Function, which handles the one-time token
-- with the service role on the server.

revoke all on function public.psp_confirm_email_verification_hash(text)
  from public,anon,authenticated;
grant execute on function public.psp_confirm_email_verification_hash(text)
  to service_role;
