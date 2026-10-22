-- PipSePaisa V511 | Disable duplicate unauthenticated notification webhooks.
-- The five legacy triggers call notify-signal without x-hook-secret and return HTTP 401.
-- The five newer psp_notify_* triggers already call the same Edge Function with
-- authorized secret; preserve them, all tables, all RLS, and all application code.
-- This change sends no notification and does not edit user or payment records.
-- Rollback (only if required): ALTER TABLE <table> ENABLE TRIGGER <legacy_trigger>.
BEGIN;
DO $$
DECLARE
  rec record;
  matched integer;
BEGIN
  IF position('x-hook-secret' IN pg_get_functiondef('public.psp_send_notification_webhook()'::regprocedure)) = 0 THEN
    RAISE EXCEPTION 'The primary notification webhook has no authenticated x-hook-secret header; aborting';
  END IF;

  FOR rec IN
    SELECT * FROM (
      VALUES
        ('public.signals','psp_notify_new_signal','trg_notify_signal_insert','fn_notify_content_insert'),
        ('public.signals','psp_notify_signal_update','trg_notify_signal_update','fn_notify_signal_update'),
        ('public.articles','psp_notify_new_article','trg_notify_article_insert','fn_notify_content_insert'),
        ('public.charts','psp_notify_new_chart','trg_notify_chart_insert','fn_notify_content_insert'),
        ('public.banners','psp_notify_new_banner','trg_notify_banner_insert','fn_notify_content_insert')
    ) AS x(table_name,primary_trigger,legacy_trigger,legacy_function)
  LOOP
    SELECT count(*) INTO matched
    FROM pg_trigger t
    WHERE t.tgrelid=rec.table_name::regclass
      AND t.tgname=rec.primary_trigger
      AND t.tgenabled='O'
      AND t.tgfoid='public.psp_send_notification_webhook()'::regprocedure;
    IF matched<>1 THEN
      RAISE EXCEPTION 'Expected enabled authorized primary webhook not found for %/%',rec.table_name,rec.primary_trigger;
    END IF;

    SELECT count(*) INTO matched
    FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
    WHERE t.tgrelid=rec.table_name::regclass
      AND t.tgname=rec.legacy_trigger
      AND t.tgenabled='O'
      AND p.proname=rec.legacy_function;
    IF matched<>1 THEN
      RAISE EXCEPTION 'Legacy duplicate webhook unexpectedly changed for %/%',rec.table_name,rec.legacy_trigger;
    END IF;
    EXECUTE format('ALTER TABLE %s DISABLE TRIGGER %I',rec.table_name::regclass,rec.legacy_trigger);
  END LOOP;
END $$;
COMMIT;
