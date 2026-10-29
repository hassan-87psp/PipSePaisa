-- Trigger-only function must never be callable as a REST RPC.
revoke all on function public.psp_guard_profile_role_v499() from public,anon,authenticated;
