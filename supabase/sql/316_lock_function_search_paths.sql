-- PipSePaisa V316
-- Lock mutable search_path on helper/trigger functions that use only built-ins and NEW values.

alter function public.psp_course_rate_v206(numeric) set search_path = '';
alter function public.psp_course_rate_v207(integer) set search_path = '';
alter function public.psp_lot_exness_rate_v206(numeric) set search_path = '';
alter function public.psp_lot_xm_rate_v206(numeric) set search_path = '';
alter function public.psp_sync_legacy_columns() set search_path = '';
alter function public.psp_team_touch_updated_at() set search_path = '';
alter function public.psp_touch_updated_at() set search_path = '';
alter function public.psp_vip_rate_v206(integer) set search_path = '';
alter function public.set_updated_at() set search_path = '';
alter function public.sync_profile_admin_role() set search_path = '';
alter function public.sync_profile_role_flags() set search_path = '';
