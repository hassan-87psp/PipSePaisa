PipSePaisa V301 — FreeCourse2 Tracking + Historical Backfill

Admin tab:
  FreeCourse2 Tracking

NEW:
- Existing identifiable old FreeCourse2 enrollments are automatically backfilled.
- Admin shows:
  Page Opens (live tracking only)
  Unique Visitors (live tracking only)
  Zoom/Form Clicks (live tracking only)
  Form Opens (live tracking only)
  Total Enrollments = Live + Historical
  Historical Found = old identifiable enrollments
- Historical rows are labeled “Historical backfill”.
- Live funnel conversion is calculated only from data tracked after V301 deploy,
  so old enrollments do not create fake conversion percentages.

HOW HISTORY IS FOUND:
- Existing psp_ad_submissions_v259 rows that already contain FreeCourse2 in
  source_path / referrer / utm_source / utm_campaign / utm_content / entry_path.
- Existing tracked_link_events enrollments whose page_path/metadata identifies FreeCourse2.
- The migration is idempotent: running it again does not duplicate the same historical enrollment.

LIMITATION:
Old page opens / CTA clicks that were never saved anywhere cannot be reconstructed.
Only already-identifiable historical enrollments can be recovered.

DEPLOY:
1. Upload/replace the files from this patch.
2. Run V301_FREECOURSE2_TRACKING_WITH_HISTORY.sql once in Supabase SQL Editor.
3. Current /freecourse2/index.html must contain:
   <script src="/freecourse2-tracking-v300.js?v=20260929-v300"></script>
   If it does not, use APPLY_TO_CURRENT_FREECOURSE2.py or add that one line before </body>.
4. Hard refresh Admin → FreeCourse2 Tracking.

No existing client/payment/course/team/chat data is deleted.
