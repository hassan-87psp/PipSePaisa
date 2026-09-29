PipSePaisa V287 — Ad Data + Faster Ad 2 Submission

CHANGED / NEW FILES
- sajid-live/index.html
- ad-link-admin-v287.js
- admin/ad-link-admin-v287.js
- ad2-admin-v287.js
- admin/ad2-admin-v287.js
- admin-panel.html
- admin/index.html
- V287_AD_ADMIN_LEADS_DATA_FIX.sql

FIXES
1) Ad 2 form submission is faster after enrollment response:
   - removed the extra client-side Supabase CDN/login round-trip
   - removed the extra artificial paint/sleep delay
   - WhatsApp redirect starts almost immediately after successful backend response
   - account creation, course enrollment, manager assignment, credentials email and short WhatsApp routing stay on the existing backend

2) Admin > Ad Link data visibility:
   - adds a fresh Admin-only RPC that reads the actual Ad submission table directly
   - frontend uses V287 first and falls back to the old V261 RPC if needed
   - existing Ad Link list excludes Ad 2 rows so the two campaigns remain separate
   - Ad 2 uses the same fresh data source and only shows Ad 2 rows

3) Includes the latest Ad 2 visual fixes from V286:
   - proper stacked e-form
   - 4 live sessions
   - PipSePaisa orange brand accent
   - larger / zoomed Sir Sajid portrait

DEPLOY
1. Upload/replace the files in this patch preserving folders.
2. Run V287_AD_ADMIN_LEADS_DATA_FIX.sql once in Supabase SQL Editor.
3. Hard-refresh Admin Panel (Ctrl+F5) once.

No other business logic is changed.
