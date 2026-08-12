# PipSePaisa V49 — Account Verification + Free All Access Deployment

## 1) Upload website files
Upload the V49 project to the website as usual.

## 2) Keep Supabase Auth Confirm Email OFF
Authentication → Providers → Email → Confirm Email = OFF.
This preserves direct signup + direct login. V49 uses its own post-login account verification email from Profile.

## 3) Run the V49 SQL migration
Supabase → SQL Editor → New Query.
Copy/paste and run:

`51_ACCOUNT_VERIFICATION_AND_FREE_ACCESS.sql`

This creates:
- account_verification_settings
- account_verifications
- account_verification_email_tokens
- private `verification-proofs` Storage bucket
- RLS policies
- user status/submission RPCs
- admin approval/rejection RPC
- realtime publication

## 4) Deploy two new Edge Functions
Deploy these exact function folders:

- `supabase/functions/request-account-verification`
- `supabase/functions/confirm-account-verification`

Both must use `Verify JWT = OFF` because:
- request-account-verification performs its own logged-in session verification inside the function
- confirm-account-verification must accept the one-time email token from a browser/email link

The included `supabase/config.toml` already contains both settings.

## 5) SMTP secrets
No new SMTP credentials are required if existing PipSePaisa course emails already work.
The new verification-email function reuses:

- SMTP_HOST
- SMTP_PORT
- SMTP_USERNAME
- SMTP_PASSWORD
- SMTP_FROM_EMAIL
- SMTP_FROM_NAME

## 6) Admin setup
Admin Panel → Account Verification.

Choose one:
- Direct Access After Signup
- Verification Required

The Admin page also lets you edit:
- Exness client link
- DPrime client link
- XM client link
- Exness/XM/DPrime existing-account shift instructions
- Admin WhatsApp
- Recommended deposit (default $300)

## 7) User test
1. Create a NEW user.
2. Confirm user logs in immediately — no signup verification email should block login.
3. User Panel → Profile.
4. Click Verify Account.
5. Open the verification email and click Verify Account Email.
6. Return to Profile → Click Here to Get Free All Access.
7. Select broker + Trading Account ID.
8. Continue to broker verification page.
9. Enter available deposit and upload broker email screenshot.
10. Submit.
11. User should immediately see Verification Pending and temporary access to protected services.
12. Admin → Account Verification → open proof.
13. Approve: access remains permanently unlocked and header shows Account Verified.
14. Reject: access locks again, rejection reason appears in Profile, with Upload Again + Contact Admin.

## V49 replaces the old Free Access PIN front-end flow
The old PIN/free-trial UI is no longer loaded. Old PIN welcome emails are no longer triggered by signup/course signup.
The existing send-course-email function can remain deployed for course/payment emails.
