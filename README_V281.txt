PipSePaisa V281 — Single Manager Routing + Short WhatsApp
==========================================================

PURPOSE
- Fix client/manager mismatch where a Team Member-specific link could be overridden by round robin.
- Keep Team Panel + WhatsApp on the same current manager for enrollment-based clients.
- Keep Link Manager WhatsApp synced with the selected Team Member.
- Make Admin client transfer update future WhatsApp routing as well.
- Replace the first enrollment WhatsApp message with a short message (NO email/name detail dump).

WHAT CHANGED
1) Owner priority for course enrollment:
   Admin transfer > assigned tracked link > existing owner > general round robin.
2) Existing wrong V245 assignment is corrected when the enrollment owner is resolved again.
3) All enrollment assignments for one user are kept on one current Team Member.
4) Team Panel hides stale V273/Ad rows when V245 says the current enrollment owner is another Team Member.
5) Assigned tracked links inherit selected Team Member WhatsApp/name automatically.
6) No automatic default to Miss Samiya in Link Manager.
7) Dedicated Sajid/Ghulam ad pages now keep ref in their POST tracking payload and force the WhatsApp text to the short no-email format.
8) First WhatsApp text is now like:
   Hello Miss X, I have enrolled in Sir Sajid's Batch 3 (Client ID PSP-XXXX). Kindly verify and share next steps.
   (Fundamental uses Sir Ghulam Abbas's Batch 2.)

DEPLOY — IMPORTANT
1) Upload/copy ALL files from this patch to the website, preserving the included folders.
2) Supabase Dashboard > SQL Editor > New query.
3) Paste/run: V281_SINGLE_MANAGER_ROUTING_AND_SHORT_WA.sql ONCE.
4) Wait for Success.
5) Hard refresh Admin pages. On phone/PWA, fully close PSP TEAM and reopen it.

NO OTHER BUSINESS LOGIC CHANGED
- September 2026 Team earnings cutoff: untouched.
- Course prices/payments: untouched.
- Course/batch content: untouched except the already-current Batch 3 / Fundamental Batch 2 message wording.
- Desktop/mobile design: untouched.

QUICK TEST
A) Create/choose a Link Manager link assigned to Miss Memoona.
B) Open the link in an incognito browser and enroll a new test client.
C) Expected: Team owner = Miss Memoona AND WhatsApp opens Miss Memoona.
D) WhatsApp prefilled text must be short and must NOT contain the student's email.
E) Admin > Ad Link > Search Client: transfer that same test client to Miss Amal.
F) Re-open/re-resolve the client enrollment route: future Team ownership/WhatsApp must use Miss Amal, not the old manager.
