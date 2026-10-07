-- PipSePaisa V495 — index supporting per-IP anonymous Ad tracking throttling.
-- Applied to production 2026-10-07.

create index if not exists psp_ad_events_v261_ip_created_idx
  on public.psp_ad_events_v261(ip_hash,created_at desc)
  where ip_hash is not null;
