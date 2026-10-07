-- PipSePaisa V482 — cache-table RLS defense in depth.
-- Production applied 2026-10-07.
-- Browser roles already had no direct grants; enabling RLS adds another barrier
-- without changing Team/Admin UI behavior because cache access is via guarded
-- SECURITY DEFINER RPCs or service_role.

begin;

alter table public.team_daily_auto_cache_v403 enable row level security;
alter table public.team_history_cache_v385 enable row level security;
alter table public.team_range_cache_v404 enable row level security;

revoke all on table public.team_daily_auto_cache_v403 from public,anon,authenticated;
revoke all on table public.team_history_cache_v385 from public,anon,authenticated;
revoke all on table public.team_range_cache_v404 from public,anon,authenticated;

grant select,insert,update,delete on table public.team_daily_auto_cache_v403 to service_role;
grant select,insert,update,delete on table public.team_history_cache_v385 to service_role;
grant select,insert,update,delete on table public.team_range_cache_v404 to service_role;

commit;
