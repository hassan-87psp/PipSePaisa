PipSePaisa V305 — FreeCourse2 OLD Record Recovery

ROOT CAUSE FIX
V304 only checked the expected UTM fields on the completed submission.
Older FreeCourse2 Chat traffic can have `freecourse2_chat` stored in another
saved source/metadata field or in psp_ad_events_v261.

V305:
- searches the entire saved submission row for freecourse2_chat
- searches old psp_ad_events_v261 tracking rows
- links an old event back to the completed submission by:
  visitor_id, client_id, submission/lead ID, email or WhatsApp
- deduplicates the same client
- fills assigned manager from psp_lead_assignments when possible
- keeps date + course filters
- excludes matched Chat rows from Ad 2 and Ad Link lists

INSTALL
1. Upload/replace the files in this patch.
2. Run V305_FREECOURSE2_OLD_RECORD_RECOVERY.sql once.
3. The SQL ends with a recovery-audit SELECT. Check its three counts.
4. Hard refresh Admin -> FreeCourse2 Tracking -> All.

No enrollment/payment/team ownership data is modified.
