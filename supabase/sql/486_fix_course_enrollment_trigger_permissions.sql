-- PipSePaisa V486 — fix free-course enrollment trigger permissions.
-- Security hardening correctly made psp_user_registration_at_v205 server-only,
-- but two course_enrollments trigger functions still ran as the browser role.
-- They must execute as the function owner so the private helper remains private
-- while authenticated users can enroll in their own free course.

alter function public.psp_course_segment_compat_v205() security definer;
alter function public.psp_course_segment_finalize_v205() security definer;

-- Keep deterministic trusted lookup paths.
alter function public.psp_course_segment_compat_v205() set search_path = public;
alter function public.psp_course_segment_finalize_v205() set search_path = public;

-- Do not expose the registration-date helper to browser roles.
revoke all on function public.psp_user_registration_at_v205(uuid,timestamptz)
  from public,anon,authenticated;
grant execute on function public.psp_user_registration_at_v205(uuid,timestamptz)
  to service_role;
