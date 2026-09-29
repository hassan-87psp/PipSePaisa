PipSePaisa V223 — FINAL 4-COURSE + PAYMENT CORRECTIVE PATCH
=============================================================

WHAT THIS PATCH FIXES
---------------------
1) Advance Fundamental detail page uses Sir Malik Ghulam Abbas image.
2) Instructor full name is no longer clipped in the hero badge.
3) Advance Fundamental does not show 0 Modules / 0 Sessions / 0 Structured Modules.
4) Advance Fundamental What You'll Learn + Course Outcomes use short, clean fundamental points.
5) Local Bank Transfer gets the V223 Advance Fundamental compatibility path while keeping the existing Infinity engine/callback.
6) EA & Indicator is placed directly below Signals and keeps the orange My Courses-style treatment.
7) My Courses is deduplicated to the real four courses only.
8) My Courses order is: Advanced Forex, Advance Fundamental, Basic Forex, Fundamental Forex.
9) Admin Courses Manager suppresses the legacy duplicate ADVANCE COURSE/Advanced row and shows the real four-course catalog.
10) Admin Basic/Advanced enrollment counts no longer mix other free/paid courses into those cards.
11) Admin Payments & Enrollments keeps separate Batch 1, Batch 2, Fundamental, Advanced Forex and Advance Fundamental counts/revenue.
12) Landing Our Services third card uses the supplied trading-tools service banner instead of the broken image.
13) Advance Fundamental thumbnail/course presentation stays consistent across public/course/user/admin areas.
14) Advanced Forex default curriculum is aligned to the final 8-module structure.

IMPORTANT DEPLOYMENT ORDER
--------------------------
A) Upload/replace the supplied website files.

B) Supabase SQL Editor:
   - If V221 + V222 were already run: run ONLY
       93_V223_FINAL_COURSE_CATALOG_PAYMENT_FIX.sql
   - If this is being deployed from before V221: run in order
       91_V221_ADVANCE_FUNDAMENTAL.sql
       92_V222_COURSE_PAYMENT_UI_ADMIN_FIX.sql
       93_V223_FINAL_COURSE_CATALOG_PAYMENT_FIX.sql

C) REQUIRED FOR LOCAL BANK FIX:
   Redeploy ONLY this Edge Function from the supplied file:
       supabase/functions/create-infinity-payment/index.ts

   Do NOT replace/rewrite the working Infinity callback function.
   V223 deliberately leaves the callback architecture unchanged.

D) Hard refresh the browser after deployment (Ctrl+F5).

EXPECTED RESULT AFTER DEPLOYMENT
--------------------------------
My Courses:
  Top row:    Advanced Forex Course | Advance Fundamental
  Bottom row: Basic Forex Course    | Fundamental Forex Course
  Counter: 4 Active Courses

Admin Courses Manager:
  Exactly one visible card for each of the same four real courses.
  No duplicate Advanced Forex / ADVANCE COURSE card.

Advance Fundamental:
  $150
  Live Classes
  Advanced Level
  No fake module/session counts
  Sir Malik Ghulam Abbas shown correctly

Local Bank Transfer:
  Advance Fundamental uses its own enrollment/course key in the browser.
  The V223 Edge Function supports the new paid course and includes a compatibility retry for older production prepare_infinity_payment RPC deployments.
  The existing Infinity callback is not changed.

SAFETY / DO-NOT-BREAK NOTES
---------------------------
- No auth.users changes.
- No enrollment history deletion.
- No broad rewrite of the Infinity callback/payment system.
- Legacy duplicate course rows are archived/suppressed rather than deleting historical IDs.
- Run the SQL before testing Local Bank Transfer.
- Redeploy create-infinity-payment before testing Local Bank Transfer.
