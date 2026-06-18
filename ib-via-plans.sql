-- ============================================================
-- IB-VIA-PLANS (Phase 2)  — run in Supabase SQL Editor
-- IB is now an "unlock type" on a mentor's subscription plan.
-- Students join via IB instead of paying; approval = premium.
-- Reuses payment_requests + approve_payment()/reject_payment().
-- ============================================================

-- add IB fields to the existing payment_requests table
alter table payment_requests add column if not exists request_type text default 'payment'; -- 'payment' | 'ib'
alter table payment_requests add column if not exists trading_account text;

-- (optional) quick filter
create index if not exists payment_requests_type_idx on payment_requests(request_type);

-- NOTE: approve_payment(req_id) already sets is_premium=true + premium_until
-- from duration_days, so approving an IB request unlocks the plan's services
-- exactly like a paid subscription. No extra functions needed.

-- done ✅
