PipSePaisa V226 — FINAL PAYMENT + DASHBOARD REPAIR
==================================================
Date: 2026-09-11

WHAT THIS PATCH FIXES
---------------------
1) Local Bank Transfer failing on BOTH paid courses:
   - Advanced Forex Course
   - Advance Fundamental

2) Removes checkout dependency on prepare_infinity_payment().
   The V224/V225 path could fail inside that RPC and surface only the generic
   "Local Bank Transfer could not start right now" toast.

3) Repairs stale paid-enrollment flags conservatively.
   A status-only stale "approved/enrolled" row with no access/admin/provider
   proof no longer permanently blocks checkout. Real approved/manual/provider-
   accepted access is never reset.

4) Repairs Infinity callback finalization for both paid course keys.

5) Repairs /dashboard/ and /my-courses/ direct/deep-link boot:
   - static assets are root-absolute instead of nested relative paths
   - one-time session boot recovery/watchdog added
   - no refresh loop introduced

6) Fixes the V225 request-id sequence floor bug.

DEPLOY IN THIS EXACT ORDER
--------------------------
A. Upload/replace these website files, preserving folders:
   /index.html
   /course-enrollment.js
   /psp-v28-fixes.js
   /user-app-core-v29.js
   /dashboard/index.html
   /my-courses/index.html

B. Supabase SQL Editor:
   Run ONLY:
   96_V226_FINAL_PAYMENT_DASHBOARD_REPAIR.sql

   The final result table should show READY for:
   - Local Bank Method
   - Advanced Forex Local Bank
   - Advance Fundamental Local Bank
   - Enrollment Trigger
   - Infinity Callback Finalizer

   If either paid-course Local Bank row says NOT READY, do NOT test checkout yet.
   It means the Admin PKR Local Bank amount is still missing in the database.

C. Supabase Edge Functions:
   Redeploy ONLY:
   supabase/functions/create-infinity-payment/index.ts

   DO NOT redeploy or replace infinity-payment-callback. V226 SQL repairs the
   DB finalizer used by the existing callback function.

D. Clear hosting/CDN cache if your host caches HTML/JS.
   Desktop: hard refresh (Ctrl+F5).
   Mobile/PWA: fully close browser/app once and reopen.

HOW V226 PAYMENT DIAGNOSTICS WORK
---------------------------------
The checkout Edge Function now returns phase/code/version diagnostics without
exposing secrets. If a provider-side problem remains, the browser stores the
last response in:

  window.PSP_LAST_LOCAL_BANK_ERROR

and logs "Local Bank Transfer start failed" in Console. V226 also returns the
header:

  X-PipSePaisa-Payment-Version: v226

This makes it easy to verify that the new function is actually deployed instead
of an old cached function.

IMPORTANT SAFETY / DATA NOTES
-----------------------------
- No approved/manual enrollment is bulk-deleted.
- No payment history is deleted.
- auth.users is not altered.
- Existing Infinity callback URL/secret model is preserved.
- USDT flow is not rewritten.
- Working unrelated Admin/Mentor/Signals systems are not intentionally changed.

FILES IN THIS PATCH
-------------------
96_V226_FINAL_PAYMENT_DASHBOARD_REPAIR.sql
index.html
dashboard/index.html
my-courses/index.html
course-enrollment.js
psp-v28-fixes.js
user-app-core-v29.js
supabase/functions/create-infinity-payment/index.ts
README_V226_DEPLOY.txt
