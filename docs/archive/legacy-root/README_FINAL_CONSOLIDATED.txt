PipSePaisa Consolidated Fix Build

1. Run 45_COURSE_ENROLLMENT_RELIABILITY_FIX.sql in Supabase after Query 44.
2. Upload the complete ZIP contents, replacing old files. Do not mix files from older ZIPs.
3. Clear hosting/CDN cache and hard refresh.

Included fixes:
- Single market ticker and duplicate guard
- Instant local login modal; black boot splash disabled
- Original PipSePaisa logo in login modal
- Performance chart data rendering and resize repair
- Free/paid course enrollment RPC with database verification before redirect
- Existing-user Name, Email, WhatsApp and Password flow
- My Courses database-backed cards and statuses
- Admin Free/Paid enrollment views (existing admin module retained)
- Dark-theme social/service sections
- Mobile footer and unused hamburger cleanup
- New DPrime/XM/Exness light and dark broker banners
- Correct client/partner links
