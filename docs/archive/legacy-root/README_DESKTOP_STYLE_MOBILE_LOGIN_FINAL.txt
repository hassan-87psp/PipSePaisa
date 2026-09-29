PipSePaisa desktop-style mobile restoration

Fixed:
- Public pages on mobile now render like the desktop website, scaled to fit the phone.
- Previous aggressive mobile card/header redesign was not used.
- Landing Login button directly opens the local login popup on mobile.
- Other public-page Login links open landing.html#login.
- Supabase session remains active until the user explicitly logs out.
- Last email is remembered; password stays securely handled by the browser password manager.
- Login button remains Login instead of incorrectly switching to Dashboard.
- Notification prompt hides the PWA install card while visible.
- After successful push subscription, the notification prompt does not show again on that browser.
- Broker Comparison remains the desktop table layout on mobile.

Upload the COMPLETE ZIP, clear hosting/CDN cache, then hard refresh.
No new SQL query is required.
