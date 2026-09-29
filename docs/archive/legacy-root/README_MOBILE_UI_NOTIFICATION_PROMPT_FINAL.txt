PipSePaisa Mobile UI + Notification Prompt Final

What was corrected
==================
- Rebuilt from the previously verified mobile/login ZIP so the approved mobile
  header and navigation remain unchanged.
- Notification code runs only in the top-level index page, not inside landing iframe.
- A custom Subscribe for Notifications prompt appears after about 1 second.
- The notification prompt appears before and temporarily hides the PWA install banner.
- The Subscribe button opens Chrome's native Allow/Block permission request.
- OneSignal subscription is confirmed before showing “Subscribed”.
- Stale localStorage subscription flags are ignored.
- OneSignal is initialized only once.
- Root OneSignal service-worker files are included.

OneSignal dashboard
===================
Disable/delete the dashboard Push Slide Prompt to avoid a second prompt.
Keep the web Site URL matching the live canonical website.

Deployment
==========
Upload the complete ZIP, clear hosting/CDN cache, and hard refresh.
The mobile layout/header was not redesigned or changed.
