# PipSePaisa — Complete Fresh Build

## Included
- Landing page
- Login / registration / forgot password
- User platform
- Mentor panel
- Admin panel
- Trading journal
- Signals with TP1–TP4, result pips, Free/Premium/VIP access
- Courses, progress, quiz tables
- Articles, charts, banners
- VIP plans, payment methods and payment requests
- Community groups, official read-only group, posts, comments and reactions
- Notifications, support tickets, AI report table
- Secure Supabase RLS
- OneSignal Edge Function starter
- Responsive light/dark interface

## 1. Supabase
Run these files in order:
1. `supabase/migrations/001_complete_schema.sql`
2. `supabase/migrations/002_seed_admin_and_official_group.sql`
3. `supabase/migrations/003_storage.sql`

Create your first account, then edit `002_seed_admin_and_official_group.sql` with your email and run it.

## 2. Publishable key
Open:
`assets/js/config.js`

Replace:
`PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE`

with the **Publishable / anon key** from Supabase.
Do not put the service role key in frontend files.

## 3. GitHub upload
Keep your existing `CNAME`.
Upload all files and folders from this package to the repository root and commit.

## Important
This is a complete fresh foundation and functional CRUD starter. Some advanced workflows such as rich chat composer, automated signal closure calculations, full payment gateway, email delivery, and OneSignal web subscription UI require provider credentials and final business rules before production launch.
