PipSePaisa V308 — Fast Tracking + Member Chats Fix

WHY THIS PATCH
- The screenshot was still rendering the older V305 FreeCourse2 JS.
- V308 puts the FreeCourse2 Tracking UI directly inside admin HTML, so it no longer depends on a separate JS file being uploaded/cached.
- Member Chats is patched directly in the existing renderAdminChats() function, so the third tab cannot be missed by load-order timing.

FREECOURSE2 SPEED
- Admin makes ONE RPC: psp_admin_fc2_dashboard_v308.
- It reads only indexed cache tables.
- Historical full-table matching runs once when the SQL is installed, not every refresh.

MEMBER CHATS
Admin -> Member Chats now has:
Direct Chats | Community | Live Desk / AI Chats
Live Desk / AI Chats shows all stored website conversations and their full message history.

INSTALL
1. Upload/replace admin-panel.html and admin/index.html from this patch.
2. Run V308_FAST_TRACKING_ADMIN_CHATS.sql once.
3. Hard refresh the Admin panel (Ctrl+Shift+R).
4. Check FreeCourse2 Tracking and Member Chats.
