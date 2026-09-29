PipSePaisa Mobile UI, Login, Session and Realtime Fix

Fixed:
- Mobile header now always shows logo, Login/Dashboard and hamburger.
- Mobile Login click opens the auth modal reliably.
- Login modal is above every PWA/notification prompt.
- Supabase persistent session remains active until the user manually logs out.
- Last email is remembered; password is handled securely by the browser password manager through proper autocomplete fields.
- Notification prompt temporarily hides the PWA install banner, preventing all overlap.
- Once push subscription is confirmed, the notification prompt stays hidden on that browser.
- Broker comparison becomes readable mobile cards instead of a tiny desktop table.
- Public landing/course/partner/tools pages reload automatically after realtime admin content changes.
- Existing panel realtime listeners remain enabled.

Run 50_COMPLETE_REALTIME_ENABLEMENT.sql if it has not already been run.
Upload the complete ZIP, clear hosting/CDN cache, and hard refresh.
