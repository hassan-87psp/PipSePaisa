PipSePaisa V246 — Isolated Team Leads + 2 Automatic Free-Course Links
====================================================================

WHAT CHANGED
1. Team Panel Access no longer shows old historical tracked-link totals.
2. Old data is preserved separately in the existing Team Performance / Link Manager areas.
3. Team Panel Access top cards show ONLY the two new V246 auto-link stats.
4. Existing Team Members automatically receive TWO fresh links:
   - Basic Forex Course — Batch 2
   - Fundamental Forex Course
5. Every future Team Member created from Team Panel Access gets both links automatically.
6. No more manual "Assigned Admin-Created Link" selection during Team Member creation.
7. Both links are shown under each Team Member with a Copy button.
8. Automatic Leads ON/OFF remains independent from Team Panel account Active/Disabled.
9. New Assigned Leads counter starts from the V246 rollout time; previous lead/history data is not mixed into this page.
10. Removing a Team Member disables the two V246 auto links; old historical data is not deleted.

DEPLOY
A) If V245 SQL was already installed, run ONLY:
   108_V246_ISOLATED_TEAM_LEADS_AUTO_FREE_LINKS.sql

B) If V245 SQL was NOT installed yet, run in this order:
   107_V245_ROUND_ROBIN_LEAD_DISTRIBUTION.sql
   108_V246_ISOLATED_TEAM_LEADS_AUTO_FREE_LINKS.sql

Then upload/replace the included project files, keeping the same folder paths.

FILES CHANGED
- team-performance-admin-v56.js
- admin-panel.html  (only Team Panel script cache-bust line changed)
- admin/index.html  (only Team Panel script cache-bust line changed)
- 108_V246_ISOLATED_TEAM_LEADS_AUTO_FREE_LINKS.sql

NOT TOUCHED
- Payment Review Center
- Payment/Infinity flow
- Existing Team Performance historical data
- Existing Link Manager historical data
- Courses UI
- Visitor/Team Live Desk UI
- Signals, Finance, EA & Indicator UI

Expected URLs are created automatically in this form:
https://pipsepaisa.com/courses.html?psp_enroll=basic-b2&ref=<team-basic-ref>
https://pipsepaisa.com/courses.html?psp_enroll=fundamental&ref=<team-fundamental-ref>
