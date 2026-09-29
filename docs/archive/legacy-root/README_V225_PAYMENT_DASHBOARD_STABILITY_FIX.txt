PipSePaisa V225 — Payment + Dashboard Stability Fix

PURPOSE
- Repair Local Bank / Infinity checkout for BOTH paid courses:
  1) Advanced Forex Course (advanced)
  2) Advance Fundamental (advance-fundamental)
- Recover only stale Infinity enrollment states that incorrectly say course access is already active.
- Prevent Infinity request-id collisions after prior SQL/sequence changes.
- Repair dashboard deep-link/boot race on desktop and mobile without redesigning the UI.

ROOT CAUSES ADDRESSED
1. V224 prepare_infinity_payment added an internal psp_is_service_role() gate even though EXECUTE was already restricted to service_role. In some PostgREST execution contexts this can reject the RPC and break BOTH paid courses. V225 removes that brittle internal gate while keeping function EXECUTE restricted to service_role.
2. Interrupted/older Infinity attempts can leave a course_enrollments row looking approved/enrolled without an accepted Infinity payment. V225 self-heals only Infinity-managed rows with no accepted provider payment and no manual/admin approval evidence. Genuine paid/manual access is never reopened.
3. infinity_request_id_seq can fall behind stored provider_request_id values after patch/recreate operations. V225 synchronizes the sequence above the largest existing request id.
4. Dashboard route restoration had a timing race: mainApp could become visible before psp-v28-fixes installed its MutationObserver, leaving the boot mask/route unapplied. V225 checks immediately + delayed retries, adds a CSS.escape fallback, and prevents route state from getting stuck.

DEPLOYMENT ORDER (IMPORTANT)
1. Upload/replace these website files:
   - index.html
   - dashboard/index.html
   - my-courses/index.html
   - course-enrollment.js
   - psp-v28-fixes.js
2. Supabase SQL Editor: run ONLY 95_V225_PAYMENT_DASHBOARD_STABILITY_FIX.sql if V224 was already installed.
3. Redeploy ONLY Supabase Edge Function:
   supabase/functions/create-infinity-payment/index.ts
4. DO NOT modify/redeploy infinity-payment-callback for this patch.
5. Hard refresh browser. On installed/PWA/mobile builds, fully close/reopen once after deployment so old cached HTML/JS is discarded.

SQL HEALTH CHECK
At the end of the SQL run, expected rows:
- Infinity RPC = READY
- Advanced Forex Local Bank = READY
- Advance Fundamental Local Bank = READY
If either course says NOT READY, do not guess an exchange rate. Fix the course Local Bank PKR amount in Admin first.

DIAGNOSTICS
If Local Bank still fails after all three deployment steps, open browser console and run:
  window.PSP_LAST_LOCAL_BANK_ERROR
The V225 browser file records a safe error code/phase/request id. Edge Function logs also include the same request trace. This identifies whether failure is in enrollment lookup, RPC preparation, callback token, or Infinity provider create-request without exposing secrets to the UI.

SECURITY / DATA SAFETY
- Does not alter auth.users or auth triggers.
- Does not delete payment history.
- Does not delete approved/manual enrollment records.
- Keeps Advanced Forex and Advance Fundamental as separate course keys/revenue/payment histories.
- Keeps callback token architecture unchanged.
