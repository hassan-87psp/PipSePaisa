PipSePaisa V276 — Free Batch Records + Team Old Clients PATCH

ONLY REQUESTED FIXES INCLUDED

1) Admin > Payments & Enrollments > Free Course batches
- Selecting a Free Batch card now clears stale record search/type/method/status/date filters.
- The selected batch records therefore cannot stay hidden by a previous search such as "asad".
- Paid-course behavior and payment processing logic are unchanged.

2) Team Panel > My Clients
- Fixed old client rows being collapsed by shared tracking reference_code.
- Old V206 tracking clients now use actual client identity as the unique merge key.
- This restores old + current client visibility/counts for every team member from the data already returned by the existing sources.
- Existing V273 ownership/exclusion rules remain active, so Admin transfers are not bypassed.
- September 2026 earnings cutoff/calculation logic is untouched.

FILES TO REPLACE
- /admin-payments-ux-v222.js
- /admin-panel.html
- /admin/index.html
- /team-panel.html
- /team/index.html

No SQL/database migration is required for these two fixes.
