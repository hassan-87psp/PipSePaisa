PipSePaisa Panels Fully Fixed

Root cause fixed:
1. login.html, user.html, mentor.html and admin.html were using different
   Supabase auth storage keys. A login session made on one page was invisible
   to the other pages.
2. Admin access checked only is_admin=true, while the SQL seed primarily set
   role='admin'.
3. Some links still pointed to removed filenames such as mentor-panel.html.

What changed:
- Every page now uses the shared auth storage key: pipsepaisa-auth
- Login routes users by profile role
- user.html redirects mentors/admins to the correct panel
- Admin accepts role='admin' OR is_admin=true
- Old filenames were replaced with user.html / mentor.html / admin.html
- Login links use ?v=5 to bypass stale GitHub Pages/browser cache

Required:
Run sql/13_PANEL_ACCESS_FIX.sql once in Supabase SQL Editor.

Admin setup:
After creating your account, set it as admin with:
update public.profiles
set role='admin', is_admin=true
where email='YOUR_EMAIL';

Mentor setup:
Use the Mentor Panel Sign Up tab, or set:
update public.profiles
set role='mentor'
where email='MENTOR_EMAIL';
