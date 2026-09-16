PipSePaisa V243 — AI Live Desk + Human Handoff + Mobile UX Final
===============================================================

PURPOSE
- Upgrade V242 Live Desk without changing Payments, Infinity, Courses, Auth, Signals, EA licensing, Finance or Admin Dashboard.
- Fix visitor mobile keyboard/viewport/composer overlap issues.
- Fix Team Panel mobile Live Desk so inbox + conversation work like an app.
- Add AI-first natural Roman Urdu / Roman English replies using the existing PipSePaisa AI backend.
- Add human handoff when visitor asks for a human/manager.
- Add manager AI co-pilot tools without auto-sending manager replies.
- Auto-open the "Would you like to chat with us?" pre-chat prompt on first public-site visit.

WHAT IS INCLUDED
Visitor:
- First-visit automatic chat prompt.
- WhatsApp number + email required before chat starts.
- Persistent conversation across public PipSePaisa pages.
- Mobile full-screen WhatsApp-style chat layout.
- visualViewport keyboard handling; header stays visible and composer stays above keyboard.
- Sent / delivered / seen, typing, timestamps, unread badge, history.
- AI Assistant replies first in natural Roman Urdu / simple English.
- Correct PipSePaisa service/course/payment knowledge and approved action links.
- Referral / UTM attribution is preserved in enrollment/action links.
- Human request immediately turns AI off and hands the chat to Team Panel.

Team Panel:
- Mobile Inbox -> Conversation flow.
- All / Unassigned / Mine / Waiting / Open / Follow-ups / Closed filters.
- AI / HUMAN badges, unread count, assignment, transfer/takeover, priority, tags, notes, follow-ups, lead stage, conversion tracking.
- AI co-pilot: Suggest Reply, Summary, Intent, Next Action.
- "Suggest Reply" only fills a suggestion card; it NEVER auto-sends. Manager chooses Use Reply and then sends manually.

AI SAFETY / CONTROL
- The browser never receives Gemini/Groq API keys.
- Live Desk Edge Function calls the existing PipSePaisa AI Report backend, so the existing AI provider/fallback configuration remains server-side.
- A late AI request cannot reply after a human has taken over.
- AI does not invent missing prices/dates/eligibility/payment status and does not request passwords/OTP/private keys.

DEPLOYMENT — V242 IS ALREADY INSTALLED
1) Upload/replace all website files in this ZIP, preserving folders exactly.
2) Supabase SQL Editor: run ONLY
      105_V243_LIVE_DESK_AI_MOBILE.sql
3) Deploy this Edge Function:
      supabase/functions/live-desk-ai/index.ts
   IMPORTANT: deploy live-desk-ai with Verify JWT OFF / --no-verify-jwt.
   This is required because public visitors are authenticated by the random Live Desk visitor token inside the function, while Team AI tools validate the existing Team session token.
4) Do NOT redeploy or change Infinity payment functions.
5) Hard refresh desktop (Ctrl+F5). On mobile, fully close the browser/PWA and reopen.

CLI EXAMPLE
  supabase functions deploy live-desk-ai --no-verify-jwt

IF V242 SQL WAS NEVER INSTALLED
Run 104_V242_LIVE_DESK.sql from the previous V242 package first, then run 105_V243_LIVE_DESK_AI_MOBILE.sql.

NO NEW AI KEYS REQUIRED
V243 reuses the existing endpoint:
  https://pipsepaisa-api.vercel.app/api/ai-report
The existing Gemini/Groq provider setup remains in that backend.
