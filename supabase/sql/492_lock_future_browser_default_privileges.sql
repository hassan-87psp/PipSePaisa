-- PipSePaisa V492 — future public-schema objects are opt-in for browser roles.
-- Applied to production 2026-10-07.
--
-- Existing objects are unchanged by ALTER DEFAULT PRIVILEGES.

begin;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

revoke all on table public.tracked_link_stats from anon;
revoke insert, update, delete on table public.tracked_link_stats from authenticated;
grant select on table public.tracked_link_stats to authenticated;

commit;
