-- ============================================================
--  PipSePaisa — Signals: TP3 + Result tracking
--  Run once in Supabase SQL editor.
-- ============================================================

alter table public.signals add column if not exists take_profit3 numeric;
alter table public.signals add column if not exists result_pips  numeric;            -- pips profit/loss when closed (+45 / -20)
alter table public.signals add column if not exists tp_hit       integer default 0;  -- 0=none, 1=TP1, 2=TP2, 3=TP3 (drives the progress bar)
alter table public.signals add column if not exists closed_at    timestamptz;        -- when admin closed / hit final

-- status values used by the app: 'active' | 'tp1' | 'tp2' | 'tp3' | 'sl' | 'closed'
