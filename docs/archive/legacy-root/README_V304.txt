PipSePaisa V304 — FreeCourse2 Chat Records + Filters

WHAT CHANGED
- Admin -> FreeCourse2 Tracking now shows ALL saved enrollments whose source is:
  utm_source = freecourse2_chat
  (legacy freecourse2 + chat_to_form is also accepted)
- Old + new chat-sourced enrollments appear in one table.
- Table columns:
  Date/Time, Name, Email, WhatsApp, Client ID, Course, Batch,
  Assigned Manager, Source.
- Date filters:
  All, Today, Yesterday, Last Week, Last Month, Custom Date.
- Course filters:
  All Courses
  Sajid Khan Ghori — Batch 3
  Ghulam Abbas — Batch 2
- Ad 2 and Ad Link screens now exclude FreeCourse2 Chat leads so the records
  stay cleanly separated in the new tracking tab.
- Historical link-click/form-open counts are read from psp_ad_events_v261 when
  those events were already saved with freecourse2_chat source.
- Future FreeCourse2 links support both Sajid Batch 3 and Ghulam Abbas Batch 2.

INSTALL
1. Upload/replace all files in this patch.
2. Run V304_FREECOURSE2_RECORDS_FILTERS.sql once in Supabase SQL Editor.
3. Hard refresh Admin.
