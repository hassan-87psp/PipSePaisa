PipSePaisa V302 — FreeCourse2 Tracking + Form Hotfix

FIXES
1. Restores the known-working V298 Sir Sajid form code.
   V301 accidentally inserted tracking code inside the form's inline JavaScript
   at the wrong location, which could stop the form submit handler.
2. Tracking is now isolated in external JS so it cannot break enrollment.
3. /freecourse2/ tracking is added to live-desk-v242.js ONLY when pathname is /freecourse2/.
4. V302 SQL reruns historical backfill with SQL-Editor/postgres permission and also checks
   psp_ad_events_v261 for old FreeCourse2-marked events.

DEPLOY
- Upload all files in this patch.
- Run V302_FREECOURSE2_TRACKING_FORM_HOTFIX.sql once.
- Hard refresh /freecourse2/, /sajid-khan-ghori/ and Admin.
- Test:
  /freecourse2/ open -> click GET MY FREE ZOOM LINK -> form opens -> submit.
  Then Admin -> FreeCourse2 Tracking -> Refresh.

No existing enrollment, payment, Team routing or client ownership logic is replaced.
