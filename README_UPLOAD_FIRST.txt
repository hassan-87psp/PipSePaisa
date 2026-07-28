PipSePaisa Full Ticker + Enrollment Fix

Root causes fixed:
1. Previous ZIP was missing course-enrollment.js and related assets.
2. TradingView ticker was rebuilt on DOMContentLoaded, pageshow and resize, creating duplicate rows.
3. Course choice buttons now have both inline and delegated click handling.
4. Paid payment methods load from Admin Payment Methods and display account details with Copy buttons.

Steps:
1. Run 46_COURSE_PAYMENT_SIGNAL_CHART_SCHEMA_REPAIR.sql in Supabase if not already run.
2. Upload/replace the COMPLETE ZIP contents, not only HTML files.
3. Clear hosting/CDN cache and hard refresh.

Do not mix files from older ZIPs.
