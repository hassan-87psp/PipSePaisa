PipSePaisa V217 AUTH STABILITY HOTFIX

Fixes:
1. Generic signup no longer sends retired psp_auto_enroll_course metadata.
2. Embedded landing page no longer owns/refreshes the same persistent Supabase session.
3. Landing login/signup uses the parent app's single persistent auth client.
4. Transient SIGNED_OUT is rechecked before returning the user to landing.
5. Explicit logout still works immediately.
6. DB SQL backs up/disables legacy auth.users profile/course triggers that can break signup.
7. Safe fail-open profile trigger + authenticated profile self-heal RPC.
8. Cache keys bumped so mobile browsers receive the new auth code.

Deploy order:
1) Run PipSePaisa_V217_AUTH_STABILITY.sql in Supabase SQL Editor.
2) Upload/merge this patch preserving folders.
3) Hard refresh once / close and reopen the PWA/browser tab.

No Edge Function redeploy is required.
