PipSePaisa V220 — Deep Smoothness + Manual Paid Course Access

INSTALL ORDER
1) Run 90_V220_MANUAL_PAID_COURSE.sql in Supabase SQL Editor.
2) Upload/merge the remaining patch files into the website root.
3) Hard refresh once after deployment.

MANUAL PAID COURSE
Admin > Payments & Enrollments > Add Paid User
- Search an existing user by name/email
- Upload payment receipt/proof (required)
- Enter payment amount
- Optional Admin note
- Approve & Activate Access
- Existing Advanced enrollment is updated, not duplicated
- Record is labeled "Manual / Admin Added"
- Receipt remains available through View Slip
- Approved paid-course revenue sync is attempted automatically

PERFORMANCE
- V220 performance CSS/JS replaces V218 performance layer
- Internal page entrance animation removed for instant tab switching
- More aggressive off-screen paint skipping
- Mobile live blur/decorative animation reduced
- Shadows/transitions suspended only during real scrolling
- Dashboard short-lived session cache makes refresh/back-navigation instant
- Clean-route copies are included so direct /signals, /dashboard, etc. use the same V220 build

No Edge Function redeploy is required.
