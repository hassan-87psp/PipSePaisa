PipSePaisa V229 — INFINITY CALLBACK SYNC + FAST CHECKOUT
==========================================================

WHAT THIS FIXES
1) Infinity shows Rejected/Accepted but Admin stays Auto Processing.
2) Local Bank status appears automatically in Admin without an Admin decision.
3) Legacy Local Bank rows stuck >20 minutes are changed to Expired/retryable.
4) Local Bank button opens faster by warming the Edge Function early and parallelizing independent DB reads.
5) Callback accepts Infinity GET or POST delivery and more status/payload naming variants.

CRITICAL ROOT CAUSE
Infinity is an external provider. It does NOT send a Supabase user JWT to the callback.
Therefore infinity-payment-callback MUST have Verify JWT = OFF.
The callback is still secured by the random per-payment callback token stored in course_payments.
If Verify JWT is ON, Supabase blocks Infinity before the callback code runs, leaving Admin at INITIATED/AUTO PROCESSING.

DEPLOY IN THIS EXACT ORDER

A) WEBSITE
Replace only:
- course-enrollment.js
- index.html
- my-courses/index.html
- admin-payments-ux-v222.js
- admin-panel.html

B) SQL
Run ONLY:
- 98_V229_INFINITY_CALLBACK_SPEED_SYNC.sql

Expected final verification row:
- Infinity waiting >20m after repair = 0
  (a callback arriving later as accepted can still activate access.)

C) EDGE FUNCTIONS — BOTH MUST BE DEPLOYED
1. create-infinity-payment
   file: supabase/functions/create-infinity-payment/index.ts
   Verify JWT = ON

2. infinity-payment-callback
   file: supabase/functions/infinity-payment-callback/index.ts
   Verify JWT = OFF  <<< CRITICAL

Supabase CLI equivalent:
  supabase functions deploy create-infinity-payment
  supabase functions deploy infinity-payment-callback --no-verify-jwt

If using Supabase Dashboard instead of CLI:
- Open Edge Functions > infinity-payment-callback
- Turn OFF "Verify JWT with legacy secret" / JWT verification (wording can vary)
- Deploy the V229 callback code

The included supabase/config.toml also declares:
  [functions.create-infinity-payment] verify_jwt = true
  [functions.infinity-payment-callback] verify_jwt = false

D) DO NOT CHANGE
- Infinity API key
- Infinity callback token system
- USDT/manual review flow
- Admin approval logic for USDT
- Other course/payment logic

EXPECTED TEST
1) Open Advanced Forex > Local Bank.
2) Infinity hosted page should start noticeably faster.
3) Reject a test payment at Infinity.
4) Admin Payments & Enrollments should move it from Auto Processing to Rejected automatically, normally within a few seconds.
5) Repeat with Advance Fundamental.
6) A Local Bank request left incomplete for >20 minutes should become Expired and allow retry.

If callback still does not update after Verify JWT is OFF, inspect Edge Function logs for infinity-payment-callback. V229 accepts both GET and POST and records unsupported callback payloads in the logs.
