PipSePaisa V280 — TEAM MOBILE CLIENT DATA FIX

Fix only:
- Team Panel My Clients data showing 0 / not loading on mobile.
- Keeps old + current/fresh assigned clients.
- Current ownership/ad clients are no longer incorrectly removed by stale historical exclusion rows.
- Round-robin session resolver now uses the stable V56/V206 Team session path first, so a Performance RPC error cannot make assigned clients disappear.
- One safe retry is added for temporary empty responses on mobile session restore.
- Desktop UI, mobile design, earnings cutoff and commission rules are unchanged.

DEPLOY:
1) Supabase SQL Editor -> run V280_TEAM_CLIENT_SESSION_FIX.sql once.
2) Upload team-panel.html and team/index.html preserving paths.
3) On phone: close PSP TEAM/PWA completely and reopen once (or refresh).
