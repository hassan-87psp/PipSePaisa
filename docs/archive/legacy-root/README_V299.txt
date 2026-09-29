PipSePaisa V299 — User Export CSV + Client Owner Fix

ONLY requested User Management export change.
No Team, earnings, payments, courses, landing pages, email campaigns or other UI logic changed.

Fixes:
1. Admin > Users > Export CSV button works again even if the old V28 script has a parse/runtime issue.
2. Export fetches ALL registered users (paged beyond the 1000-row PostgREST limit).
3. CSV columns:
   - Name
   - Email
   - WhatsApp
   - Client ID
   - Registration Link
   - Client Owner
   - Joined
   - Role
4. Client Owner priority:
   - latest Admin manager override
   - current enrollment lead assignment
   - Team Member assigned to original tracked link
   - Direct

DEPLOY:
1. Upload/replace the files from this patch using the same paths.
2. Supabase SQL Editor: run V299_ADMIN_USER_EXPORT.sql once.
3. Hard-refresh Admin Panel (Ctrl+F5).
4. Admin > Users > Export CSV.

This SQL is read-only for existing data. It only creates/replaces the Admin export RPC; it does not UPDATE/DELETE user data.
