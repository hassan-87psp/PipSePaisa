PipSePaisa Firebase Push Setup

1) Run firebase_push_setup.sql in Supabase SQL Editor.

2) Deploy Supabase Edge Function:
   supabase functions deploy send-push --no-verify-jwt

3) Set Supabase Edge Function secrets (do NOT put these in frontend HTML):
   supabase secrets set FIREBASE_PROJECT_ID="pipsepaisa-notifications"
   supabase secrets set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@pipsepaisa-notifications.iam.gserviceaccount.com"
   supabase secrets set FIREBASE_PRIVATE_KEY="PASTE_PRIVATE_KEY_FROM_JSON_HERE_WITH_\\n"
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"

4) Upload firebase-messaging-sw.js to website root, same level as index.html.

5) After user logs in, browser will ask notification permission. If user clicks Allow, token saves in push_subscriptions.

6) Admin/Mentor publish Signal/Chart/Article/Banner -> notification table + real FCM push.

Important: The private Firebase service account JSON is NOT included in this ZIP for security.
