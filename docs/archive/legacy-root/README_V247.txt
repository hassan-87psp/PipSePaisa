PipSePaisa V247 — FINAL CORRECTED PATCH
Shared Free-Course Links + Fresh Round-Robin Leads + Historical Batch Tabs

IMPORTANT
=========
This is PATCH ONLY. Do not replace the whole project.
The current site already has V245/V246. Run V247 SQL FIRST, then upload the web files.

WHAT THIS FIXES
===============
1) Exactly TWO shared enrollment links total (NOT per Team Member):
   - Sir Sajid Free Course — Batch 2
     https://pipsepaisa.com/courses.html?psp_enroll=basic-b2
   - Sir Ghulam Abbas Fundamental — Batch 2
     https://pipsepaisa.com/courses.html?psp_enroll=fundamental

2) New enrollments from those shared links enter ONE common round-robin pool.
   Example: Amal -> Samiya -> Memona -> Amal...

3) Leads ON/OFF is separate from Team Panel login.
   - Leads OFF: member is skipped for NEW leads only.
   - Leads ON: member rejoins future rotation.
   - Missed leads are NOT backfilled later.

4) Team Panel Access shows fresh V247 lead data only.
   Old Link Manager / old Team Performance data is not mixed into this tab.
   Old data is preserved in the database and existing historical areas.

5) Assigned client appears in that Team Member's Team Panel -> My Clients.
   Existing V245 enrollment completion redirect continues to open the assigned
   Team Member's WhatsApp with the pre-filled enrollment message.

6) Payments & Enrollments / Course Enrollments now expose historical free batches separately:
   - Sir Sajid — Batch 1
   - Sir Sajid — Batch 2
   - Fundamental — Batch 1
   - Fundamental — Batch 2
   Paid Advance course/payment data remains available as before.

7) NEW free enrollments are locked to:
   - Sir Sajid Free Course -> Batch 2
   - Sir Ghulam Abbas Fundamental -> Batch 2
   No Batch 3 is created or used.
   No batch dates are added to the UI names/headings.

INSTALL ORDER
=============
STEP 1 — Supabase SQL Editor
Run ONLY:
  109_V247_SHARED_ROUND_ROBIN_AND_BATCH_HISTORY.sql

STEP 2 — Upload/replace these project files:
  /admin-panel.html
  /admin/index.html
  /admin-payments-ux-v222.js
  /team-performance-admin-v56.js

STEP 3 — Hard refresh Admin (Ctrl+F5).

DO NOT
======
- Do not rerun V246 to recreate per-member links.
- Do not delete old enrollment/history records.
- Do not replace Infinity/payment backend flows.

QUICK TEST
==========
A) Open Admin -> Team Panel Access.
   You should see only TWO shared course links at the top.
B) Make 2-3 Team Members Leads ON and confirm WhatsApp numbers.
C) Enroll a new Sir Sajid Batch 2 client from the shared link.
   It should assign to the next active member and redirect to that WhatsApp.
D) Enroll another new client; it should go to the next active member.
E) Turn one member Leads OFF and confirm the next lead skips them.
F) Open Payments & Enrollments / Course Enrollments and verify old Batch 1 and
   Batch 2 tabs/cards are separated for Sir Sajid and Fundamental.

NOTES
=====
- V247 disables the old V246 per-member auto course links but does not delete them.
- Historical Basic Batch 1/2 mapping preserves the project's existing internal split.
- Historical Fundamental free enrollments are kept as Batch 1; new Fundamental enrollments are Batch 2.
- Existing UI/theme is retained; this patch only changes the required Team Access and enrollment/batch views.
