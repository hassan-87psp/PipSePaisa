PipSePaisa V221 — Advance Fundamental
Instructor: Sir Malik Ghulam Abbas
Status: Starting Soon (no start date shown)
Price: $250 original (strikethrough) → $150 offer
Delivery: Live classes only • Advanced level • Limited seats
Payment: USDT TRC20 + Local Bank Transfer

Included:
- Public Courses card + supplied thumbnail
- Paid enrollment/auth flow for course key: advance-fundamental
- Link Manager destination for tracked links
- Admin manual paid-user grant supports both paid courses + receipt upload
- Separate paid-course category key for team/referral attribution
- Local Bank Edge Function extended from the existing stable flow to multiple paid courses

INSTALL ORDER
1) Run 91_V221_ADVANCE_FUNDAMENTAL.sql in Supabase SQL Editor.
2) Upload/merge the patch files.
3) Redeploy ONLY Supabase Edge Function: create-infinity-payment using the included index.ts.
4) Do not replace infinity-payment-callback.

Local Bank PKR price:
- SQL automatically derives the new course's PKR amount from the existing paid-course USD→PKR ratio when that configuration is available.
- If the current paid course has no Local Bank PKR amount configured, set the Advance Fundamental Local Bank PKR price once from Admin Course Manager before using Local Bank Transfer.
