# PipSePaisa V29 Deployment — One Step at a Time

## Step 1 — Website files
Back up `public_html`, then upload the **contents inside the V29 ZIP** directly into `public_html` and overwrite matching files. Do not upload the parent folder.

## Step 2 — Database repairs
Run these once in Supabase SQL Editor, in this order:

1. `65_V29_PERMANENT_WHATSAPP_SYNC.sql`
2. `66_V29_EMAIL_CAMPAIGNS.sql`
3. `67_V29_COURSE_EDITOR_SCHEMA.sql`

## Step 3 — New campaign function
Deploy only this new function:

`supabase/functions/send-campaign-email/index.ts`

It uses the same existing SMTP secret names as `send-course-email`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL=no-reply@pipsepaisa.com`
- `SMTP_FROM_NAME=PipSePaisa`
- Supabase service-role/secret key

Do not delete or replace `notify-signal`, `send-course-email` or `zoom-register-course`.

## Step 4 — Clear old site cache
Open the live site and use a hard refresh once. The V29 asset query versions prevent old V28 files from being reused.

## Step 5 — Live regression test
Test signup, email verification, login/autofill, forgot password, Dashboard, both courses, enrollment, all 9 Zoom links, signal popup, admin users/WhatsApp, admin course editor, email campaign, clean URL and mobile UI.
