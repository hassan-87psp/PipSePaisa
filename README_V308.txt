PipSePaisa V308 — FreeCourse2 Smart AI + Stable Chat

CHANGED/NEW FILES
1) freecourse2/index.html
2) supabase/functions/freecourse2-ai/index.ts
3) V308_FREECOURSE2_STABLE_MESSAGES.sql

WHAT V308 FIXES
- Fixes visitor message disappearing/reappearing during DB refresh.
- Fixes temporary duplicate visitor bubbles.
- Adds stable client_message_id reconciliation + idempotent server replies.
- Adds automatic safe retry using the same message ID, so network retry does not duplicate the chat.
- Adds dynamic 3–4 suggested reply chips after AI replies.
- Adds natural local replies for Hello/Salam/Walikum Salam/Thanks/OK/Acha/Mtlb/Free/Kab/Kon sa etc.
- Removes simple-message dependency on generic failure fallbacks.
- Expands Forex/trading knowledge: pips, lots, leverage, margin, SL/TP/BE, RR, sessions, liquidity, market structure, support/resistance, FVG, CHoCH, engulfing/candlestick confirmation, ATR, stochastic, pending orders, MT4/MT5, CPI, PPI, FOMC, central banks and more.
- Expands course sales/objection handling for beginners, free/hidden-charge questions, mobile Zoom, outside-Pakistan users, timing, session count, broker/deposit, recording/certificate uncertainty, paid/free comparison and common ad replies.
- Keeps replies short/natural Roman Urdu + English by default.
- Current/live market/news questions still try web/current context before answering.
- Adds verified PipSePaisa contact/social knowledge:
  Support WhatsApp: +60 11-5696 1157
  WhatsApp Channel: https://whatsapp.com/channel/0029Vb97Ba4KQuJM5FbsHl3v
  Instagram: https://www.instagram.com/pipsepaisa/
  Facebook: https://www.facebook.com/share/1AUgXGtVYy/
- Exact verified YouTube/TikTok URLs were not present in the current project files, so V308 deliberately does NOT invent them. They can be added through Admin > AI Chat > Extra Knowledge / Overrides once confirmed.
- Existing /sajid-khan-ghori and /ghulam-abbas enrollment links are reused with freecourse2 tracking.
- Admin monitoring system remains unchanged and continues to see all conversations.
- Team Panel is not changed in this patch.

DEPLOYMENT ORDER
1) Upload/replace freecourse2/index.html.
2) Supabase SQL Editor: run V308_FREECOURSE2_STABLE_MESSAGES.sql ONCE.
3) Redeploy Edge Function freecourse2-ai using supabase/functions/freecourse2-ai/index.ts.
4) Hard refresh /freecourse2 or test in incognito.

NO OTHER SQL OR PROJECT FILES ARE REQUIRED.
