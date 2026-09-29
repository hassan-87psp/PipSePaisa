PipSePaisa V300 — FreeCourse2 Tracking

Admin tab name:
  FreeCourse2 Tracking

Tracks:
  Page Opens
  Unique Visitors
  GET MY FREE ZOOM LINK / form CTA clicks
  Form Opens
  Completed Enrollments
  Click-through and overall conversion %

Files to upload:
  admin-panel.html
  admin/index.html
  freecourse2-tracking-admin-v300.js
  admin/freecourse2-tracking-admin-v300.js
  freecourse2-tracking-v300.js
  sajid-khan-ghori/index.html

SQL:
  Run V300_FREECOURSE2_FUNNEL_TRACKING.sql once in Supabase SQL Editor.

IMPORTANT — current /freecourse2/index.html was not present in the project ZIP available in this chat.
To avoid overwriting/breaking the existing AI chat UI, this patch does NOT replace that page.

Add this ONE line before </body> in the CURRENT live freecourse2/index.html:
  <script src="/freecourse2-tracking-v300.js?v=20260929-v300"></script>

OR run:
  python APPLY_TO_CURRENT_FREECOURSE2.py /path/to/your/current/project

The script only adds tracking; it does not change the chat UI, AI replies or link.
