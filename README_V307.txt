PipSePaisa V307
- FreeCourse2 Tracking now reads indexed cache tables (fast).
- Old recovery checks saved freecourse2_chat, old tracking events, AND actual Live Desk chats matched by email/WhatsApp.
- Admin -> Member Chats gets a new read-only tab: Live Desk / AI Chats, showing all website visitor chats.
- Ad2 / Ad Link use server-side filtered lead RPC so recovered FreeCourse2 Chat enrollments stay separate.

Install:
1) Upload/replace files in this patch.
2) Run V307_FREECOURSE2_FASTCACHE_ADMIN_CHATS.sql once.
3) Note the final JSON `freecourse2_v307_rebuild`.
4) Hard refresh Admin.
