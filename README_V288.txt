PipSePaisa V288 — Accurate Course Enrollment Count + Website User Count + WhatsApp CSV Export

ONLY REQUESTED CHANGES INCLUDED

1) Admin > Payments & Enrollments > All Course Enrollments
- The count now represents genuine current/valid enrollments only.
- Rejected/expired duplicate course attempts are not counted as enrollments.
- Duplicate records for the same user in the same course/batch are collapsed.
- The All Course Enrollments table uses the same unique valid-enrollment logic, so the displayed total and table records match.

2) Admin > Payments & Enrollments > Total Website Users
- Added a separate “Total Website Users” KPI.
- It reads the exact count directly from the profiles table.
- A registered profile is counted once, independent of how many courses/payments that user has.

3) Export CSV
- Added “WhatsApp Number” to the Payments & Enrollments CSV export.
- The exported phone comes from the same resolved WhatsApp/contact data already shown in the admin table.

4) Cache refresh
- Updated the payments JS cache version in both Admin entry files so the browser loads V288 immediately.

FILES TO REPLACE
- /admin-payments-ux-v222.js
- /admin-panel.html
- /admin/index.html

NO SQL / DATABASE MIGRATION REQUIRED.

Important distinction:
- Total Website Users = unique registered profiles.
- All Course Enrollments = unique valid user+course/batch enrollments.
- Full History = historical payment/enrollment/provider records and can be higher by design.
