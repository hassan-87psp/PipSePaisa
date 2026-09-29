PipSePaisa final mobile correction

Fixed:
- Mobile Login button is visible, tap-safe and opens the login popup.
- On very narrow screens, crowded menu links hide while Logo, Theme and Login remain visible.
- Supabase session persists until the user explicitly logs out.
- Last email is remembered; password remains securely handled by the browser password manager.
- Logged-in visitors see Dashboard instead of Login.
- Notification subscription prompt temporarily hides the PWA install prompt, so there is no overlap.
- After successful OneSignal subscription, the notification prompt is permanently suppressed on that browser.
- Only the mobile Broker Comparison section was redesigned into readable premium cards.

Upload the COMPLETE ZIP, clear hosting/CDN cache and hard refresh.
No new SQL query is required for these UI/session fixes.
