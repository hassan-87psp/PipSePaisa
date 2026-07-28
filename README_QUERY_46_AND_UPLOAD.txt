PipSePaisa combined course/payment/schema fix

1. Run 46_COURSE_PAYMENT_SIGNAL_CHART_SCHEMA_REPAIR.sql in Supabase.
2. Replace the complete website with this ZIP.
3. Clear hosting/CDN cache and hard refresh.

Included:
- Paid course payment method details loaded from Admin Payment Methods
- Account number/wallet Copy button
- Existing and new users both see paid payment section
- Separate Admin sidebar tab: Course Enrollments
- Professional LMS-style My Courses cards
- Fixes missing columns: signals.closed_at, charts.notes, payment_methods.owner_id,
  courses.premium_plan_id and payment_requests.mentor_id
