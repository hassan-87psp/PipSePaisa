PipSePaisa V296 — ADMIN EMAIL CAMPAIGNS

Purpose
- Send the approved Sir Sajid Batch 3 promotional email entirely from Admin Panel.
- Sender is locked to: PipSePaisa <no-reply@pipsepaisa.com>
- Existing transactional course/account emails are NOT changed.

Admin flow
1) Admin -> Email Campaigns
2) Click + New Campaign
3) Preview the Batch 3 email
4) Enter your own email -> Send Test to Me
5) Optional: choose Single User and search Name / Email / Client ID
6) Or choose a bulk audience
7) Send Campaign
8) Watch queued progress and campaign history

Audience options
- All Users
- Sir Sajid Batch 1 / Batch 2 / Batch 3
- Fundamental Batch 1 / Batch 2
- Paid Students
- Free Users
- Premium / VIP Users
- Single User

Email
- Subject default: Kya Aap Hamara Pichla Batch Miss Kar Gaye?
- CTA: GET MY FREE ZOOM LINK ->
- CTA destination: https://www.pipsepaisa.com/sajid-live
- 4 Live Sessions
- Uses public PipSePaisa logo + Sir Sajid portrait
- Mobile responsive

Reliability / deliverability
- Recipients are queued in database first.
- Sending is processed in small server-side batches instead of one huge request.
- Previously unsubscribed emails are automatically excluded.
- Duplicate email addresses are removed per campaign.
- Failed sends stay visible in campaign history.
- Queued/partial campaigns can be resumed.
- Open and click tracking is included; open counts are approximate because some email apps proxy/block tracking pixels.
- No system can guarantee Inbox vs Promotions/Spam placement.

DEPLOYMENT — DO THESE IN ORDER

STEP 1 — Website files
Upload the CONTENTS of this patch into public_html and overwrite matching files.
Do not upload the parent patch folder itself.

STEP 2 — Database
Supabase -> SQL Editor -> New query
Run once:
  V296_EMAIL_CAMPAIGNS_SYSTEM.sql

STEP 3 — Edge Function
Redeploy ONLY this existing function using the included code:
  supabase/functions/send-campaign-email/index.ts
Function name must stay:
  send-campaign-email

It uses the SAME SMTP secrets already used by send-course-email:
  SMTP_HOST
  SMTP_PORT
  SMTP_USERNAME
  SMTP_PASSWORD
No new email account is required.
V296 locks the marketing sender to:
  no-reply@pipsepaisa.com

DO NOT replace/delete send-course-email, zoom-register-course, notify-signal or other functions.

STEP 4 — Hard refresh
Open Admin and Ctrl+F5 once.
Go to Admin -> Email Campaigns.

STEP 5 — First test
- Do NOT start with All Users.
- Click New Campaign.
- Put your own email in Test Email.
- Click Send Test to Me.
- Check desktop + mobile email, CTA, Inbox/Promotions/Spam.

STEP 6 — Single user test
- Audience -> Single User
- Search your own test user by email/name/client ID
- Send campaign
- Confirm tracking/history.

STEP 7 — Bulk
Only after both tests are correct, choose All Users or a specific batch and Send Campaign.
Keep the Admin tab open while a campaign is actively processing. If the browser closes, the unsent queue remains and the campaign can be resumed from Email Campaigns.

CHANGED/NEW FILES
- admin-panel.html
- admin/index.html
- email-campaign-admin-v296.js
- admin/email-campaign-admin-v296.js
- email-templates/batch3-free-course.html
- sajid-email-batch3.png
- V296_EMAIL_CAMPAIGNS_SYSTEM.sql
- supabase/functions/send-campaign-email/index.ts

NO OTHER WEBSITE/PAYMENT/TEAM/EARNINGS LOGIC IS MODIFIED.
