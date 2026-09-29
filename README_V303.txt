PipSePaisa V303 — FreeCourse2 Exact Source Attribution

WHAT THIS FIXES
- FreeCourse2 Chat traffic and Direct Ad traffic are now separated.
- A unique click_id is created ONLY when someone clicks the enrollment/Zoom CTA on /freecourse2/.
- The click_id is carried to /sajid-khan-ghori/ using URL parameters and same-origin localStorage fallback.
- The form keeps utm_source=freecourse2_chat only for a valid recent Chat journey.
- Explicit Facebook / Instagram / Ad UTMs always override stale local state and remain Direct Ad traffic.
- Successful enrollment is counted only after the form actually succeeds and returns a Client ID.

ADMIN TAB
FreeCourse2 Tracking:
Chat Page Opens
Unique Visitors
CTA Clickers
Form Opens From Chat
Successful Enrollments
Chat -> Enrollment %
Recent journey rows with click_id and Client ID.

HISTORICAL
V303 only backfills OLD submissions if they were already explicitly tagged:
utm_source=freecourse2 / freecourse2_chat OR utm_content=chat_to_form.
It does NOT guess old direct-ad traffic.

DEPLOY
1. Upload all files in this patch.
2. Run V303_FREECOURSE2_EXACT_ATTRIBUTION.sql once in Supabase SQL Editor.
3. Hard refresh /freecourse2/, /sajid-khan-ghori/ and Admin.
4. Test using:
   /freecourse2/ -> click GET MY FREE ZOOM LINK -> fill form -> successful enrollment.
5. Admin -> FreeCourse2 Tracking -> Refresh.
