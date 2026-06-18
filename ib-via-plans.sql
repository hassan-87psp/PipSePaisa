-- ============================================================
-- PHASE 2 — IB-VIA-PLANS + SERVICES + CHART AUDIENCE
-- Run in Supabase SQL Editor.
-- ============================================================

-- 1) IB fields on payment_requests (IB join = a request like a payment)
alter table payment_requests add column if not exists request_type text default 'payment'; -- 'payment' | 'ib'
alter table payment_requests add column if not exists trading_account text;
create index if not exists payment_requests_type_idx on payment_requests(request_type);

-- 2) Chart audience targeting (who can see a chart)
alter table charts add column if not exists audience text default 'all'; -- 'all' | 'premium' | 'vip'

-- ------------------------------------------------------------
-- NOTES:
-- • Services (Signal/Chart/Courses/VIP Indicator/VIP EA), IB on/off,
--   IB fee, IB link, broker & min-deposit are all stored inside
--   subscription_plans.features as markers:
--     [SERVICES]signal,chart,courses
--     [IB] [IBPRICE]50 [IBLINK]... [IBBROKER]Exness [IBDEPOSIT]100
--   => no extra columns needed on subscription_plans.
-- • approve_payment(req_id) already sets is_premium + premium_until,
--   so approving an IB request unlocks the package the same as a payment.
-- ------------------------------------------------------------

-- done ✅
