PipSePaisa V244 — AI Live Desk Stability Repair

WHAT THIS PATCH FIXES
- Visitor AI auto-reply now triggers automatically after every visitor message.
- AI call uses Supabase Functions invoke first, with retries, then a direct Edge Function fallback.
- Edge Function retries the existing PipSePaisa AI backend up to 3 times.
- If the AI provider is temporarily unavailable, the visitor still receives a safe natural fallback reply instead of silence.
- Human handoff still stops AI immediately.
- Mobile visitor chat keeps header, messages and composer stable when Android/iPhone keyboard opens.
- Visitor messages no longer sit above a large empty gap; short conversations anchor naturally near the composer.
- Raw browser alert errors removed from chat flow.
- Team Panel AI tools no longer use the fragile single fetch path; they use the same retry/fallback invocation.
- Team mobile conversation no longer clips bubbles/composer on the right.
- Team mobile header keeps Take Over + compact More menu instead of overflowing controls.
- AI/HUMAN badge now follows the real ai_mode state.
- Chat timestamps use a consistent 12-hour AM/PM format.
- Team AI tools are collapsed behind one AI Tools control on mobile to reduce clutter.
- Initial AI greeting is shorter and more natural.

DEPLOYMENT
1) Upload/replace the files in this ZIP using the exact same paths.
2) Supabase SQL Editor: run 106_V244_LIVE_DESK_STABILITY.sql once.
3) Redeploy ONLY: supabase/functions/live-desk-ai/index.ts
   IMPORTANT: live-desk-ai must be deployed with Verify JWT OFF / --no-verify-jwt.
4) Do NOT redeploy Infinity/payment Edge Functions.
5) Desktop: Ctrl + F5.
6) Mobile/PWA: fully close browser/app, reopen, and test using a fresh/incognito visitor session.

TEST
- Visitor sends: "Btao kuch courses ke bare me" -> AI should reply automatically without any button.
- Visitor sends another message -> one AI reply only, no duplicate.
- Visitor says: "human se bat karni hai" -> AI stops and human handoff begins.
- Open keyboard on visitor chat -> header remains visible and composer stays above keyboard.
- Team mobile -> open chat -> no right clipping; Take Over remains visible; Waiting/Close are under More.
- Team AI Tools -> Suggest Reply -> no raw "Failed to fetch" browser alert.

NOTE
The existing PipSePaisa AI backend remains the AI provider layer. V244 does not expose Gemini/Groq keys in the browser.
