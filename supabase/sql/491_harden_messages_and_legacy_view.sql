-- PipSePaisa V491 — close anonymous message reads and harden a legacy reporting view.
-- Applied to production 2026-10-07.

begin;

revoke select on table public.messages from anon;
grant select on table public.messages to authenticated;

alter policy "psp_staff_select"
on public.messages
to authenticated
using (true);

alter view public.tracked_link_stats_v211 set (security_invoker = true);
revoke all on table public.tracked_link_stats_v211 from anon, authenticated;

commit;
