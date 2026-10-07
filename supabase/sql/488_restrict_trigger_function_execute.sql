-- PipSePaisa V488 — trigger-only functions are not browser RPCs.

-- Browser roles do not need direct EXECUTE on trigger-only functions.
revoke all on function public.psp_course_segment_compat_v205() from public,anon,authenticated;
revoke all on function public.psp_course_segment_finalize_v205() from public,anon,authenticated;
grant execute on function public.psp_course_segment_compat_v205() to service_role;
grant execute on function public.psp_course_segment_finalize_v205() to service_role;

