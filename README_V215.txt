PipSePaisa V215 — Combined Requested Update

INSTALL ORDER
1. Supabase SQL Editor: run 88_V215_EA_INDICATOR_MARKETPLACE.sql once.
2. Upload/merge the remaining patch files over the current website.
3. Hard refresh/cache clear once after deployment if an old JS bundle is still cached.

INCLUDED
- Mobile login: prevents immediate post-login duplicate hydration/refresh loop and sends fallback sign-in to dashboard.
- Signals: manual Close/Update pips are stored as entered; BE is 0; manual results disable auto-monitor overwrite.
- Signals: after publish, WhatsApp-ready Copy Signal reminder popup; persistent Copy beside Manage.
- Mobile Signals: removes Daily/Weekly/Monthly bottom history dock; adds History beside top filters; History filters Today, Yesterday, Last 7 Days, Last Month, Custom From/To.
- EA & Indicator: marketplace/request/license workflow for user and Admin, including private user-specific licensed files.
- ADVANCE COURSE: exact final 8-session/module naming/content across public course display and relevant enrollment naming.

EA & INDICATOR
- User tab name: EA & Indicator
- Filters: Indicators/EAs and Free/Paid
- Free request: Trading Account ID, Broker, Deposit Proof
- Paid request: payment/access proof workflow
- Admin reviews request and uploads user-specific licensed build
- Status flow supports Pending/Under Review/Approved/Rejected/License Preparing/Ready to Download/Downloaded
- Private storage/RLS prevents one user from downloading another user's licensed file

IMPORTANT
- No Edge Function redeploy is required specifically for V215.
- This package does not intentionally replace or modify the V214.1 Local Bank Edge Function.
- SQL is additive for the EA & Indicator system and also updates the Advance Course metadata where matching DB columns exist.
