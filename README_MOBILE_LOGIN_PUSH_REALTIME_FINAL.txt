PipSePaisa final mobile/login/push/realtime build

Fixed:
1. Mobile Login button receives reliable delegated tap handling and opens the auth modal/fallback login route.
2. Notification bar detects #pwaInstallBanner and stays above it on desktop/mobile.
3. Once OneSignal subscription is confirmed, the notification prompt is permanently suppressed on that browser.
4. Comprehensive realtime refresh added for signals, charts, articles, courses, enrollments, settings, plans, notifications, news, payments and community data.
5. Query 50 enables existing relevant tables in supabase_realtime.

Steps:
1. Run 50_COMPLETE_REALTIME_ENABLEMENT.sql in Supabase.
2. Upload the COMPLETE ZIP contents.
3. Clear hosting/CDN cache and hard refresh.
4. Test mobile Login, notification subscription and live updates from a second browser.
