PipSePaisa V242 — LIVE DESK
================================

Purpose
-------
Adds a premium WhatsApp-style website live chat + lead inbox without changing the existing auth, course, payment, Infinity, signals, EA licensing, finance, or dashboard logic.

Visitor experience
------------------
• Floating “Want to Live Chat?” button on the public website.
• WhatsApp number + email required before chat starts.
• Persistent conversation across refresh/page navigation using an opaque visitor token.
• Full-screen mobile chat experience.
• Sent / delivered / seen ticks.
• Manager typing indicator + online state.
• Unread badge, timestamps, close/reopen flow, rating after conversation close.
• Captures ad/referral context: UTM source/campaign/medium/content/term, ref code, fbclid, gclid, first/current page and referrer.
• Existing PipSePaisa user matching by email/WhatsApp when possible.

Team Panel — Live Desk
----------------------
• New Live Chat tab inside existing Team Panel.
• Desktop shared inbox: conversation list + active chat + lead profile.
• Mobile app-style inbox → full-screen conversation flow.
• All / Unassigned / Mine / Waiting / Open / Follow-ups / Closed filters.
• Search by visitor, email, WhatsApp, source/campaign and message preview.
• Automatic assignment to the least-loaded ONLINE manager (default max 5 active chats).
• Manual Assign to Me / transfer to another manager / unassign.
• Real-time-like polling with unread counts and new-message alert.
• Sent / delivered / seen states and typing indicators.
• Quick replies: /course /fee /broker /payment.
• Internal notes invisible to visitors.
• Tags, Normal/High/VIP priority, CRM stages.
• Follow-up date/time + Tomorrow / +3 Days shortcuts.
• Mark conversion type/value.
• Visitor source/first page/current page/existing-user context.
• Operational stats + 30-day conversions, average first response and rating.

Security
--------
• Chat tables have RLS enabled and direct anon/authenticated table access is revoked.
• Visitor access is scoped by a cryptographically random token stored only in the visitor browser; database stores only its SHA-256 hash.
• Team RPCs validate the existing Team Panel session token.
• Public spam guards: conversation attempt limit + message-rate limit.
• Internal notes never appear in visitor message RPCs.

Files to upload/replace
-----------------------
index.html
landing.html
courses.html
courses/index.html
broker-reviews.html
broker-reviews/index.html
becomepartner/index.html
tradingtools/index.html
partner.html
tools-services.html
team-panel.html
team/index.html
live-desk-v242.css
live-desk-v242.js
team-live-desk-v242.css
team-live-desk-v242.js

Database
--------
Run ONCE in Supabase SQL Editor:
104_V242_LIVE_DESK.sql

No Edge Function redeploy is required.
Do NOT change Infinity payment functions/callbacks for this patch.

Deployment order
----------------
1) Upload/replace the website files above.
2) Run 104_V242_LIVE_DESK.sql in Supabase SQL Editor.
3) Hard refresh desktop (Ctrl+F5).
4) Close/reopen mobile browser/PWA once.
5) Sign in to /team on at least one manager account so manager presence becomes ONLINE.

Quick QA
--------
A. Public visitor
   1. Open pipsepaisa.com in a private/incognito browser.
   2. “Want to Live Chat?” appears bottom-right.
   3. Enter WhatsApp + email → Start Live Chat.
   4. Send a test message.

B. Team manager
   1. Open /team and sign in.
   2. Live Chat tab shows the test conversation.
   3. Open it → visitor message becomes seen.
   4. Reply → visitor sees the reply and ticks update.
   5. Test Waiting, Close/Reopen, tag, priority, internal note and follow-up.

C. Mobile
   1. Visitor chat opens full screen like a messaging app.
   2. Team Live Chat opens inbox; selecting a chat opens a full-screen conversation with a back button.

Expected assignment behavior
----------------------------
• If one or more managers are ONLINE in Team Panel, new chats are automatically routed to the least-loaded manager.
• If nobody is online, chats remain Unassigned and visible to the shared inbox. As managers come online, visitor status polling can auto-route the conversation, or a manager can open/assign it manually.

Final hardening added before release
-----------------------------------
• Team actions are bound to the authenticated Team session username; a browser cannot submit another manager username and impersonate that manager.
• Notification permission is requested only from the manager's explicit Live Chat tab click (browser user gesture).
• Public tables remain inaccessible directly; visitor and Team access remains RPC-scoped.

Stable V242 scope note
----------------------
V242 intentionally ships text chat, CRM, assignment, presence, typing, delivered/seen, ratings and lead/conversion workflows first. Binary attachment / voice-note upload is not exposed in this release because anonymous public storage writes would weaken the security model. It should be added only through a private validated upload service/Edge Function in a later isolated patch.
