-- Advanced Forex cohorts: Batch 1 closed to new sign-ups; Batch 2 starts
-- 2026-10-01 00:00:00 Pakistan time (Asia/Karachi, UTC+05).
-- Retain course_key='advanced' for course access and payment compatibility.
-- Only psp_batch_key changes; no payment status, price, receipt or access edits.
BEGIN;

CREATE OR REPLACE FUNCTION public.psp_assign_advanced_batch_v542()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $fn$
BEGIN
  IF lower(replace(btrim(coalesce(NEW.course_key,'')),'_','-'))
     IN ('advanced','advanced-course','advance-course') THEN
    NEW.psp_batch_key := CASE
      WHEN coalesce(NEW.created_at,now()) >= timestamptz '2026-10-01 00:00:00+05'
      THEN 'advanced_b2'
      ELSE 'advanced_b1'
    END;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS zzz_psp_assign_advanced_batch_v542 ON public.course_enrollments;
CREATE TRIGGER zzz_psp_assign_advanced_batch_v542
BEFORE INSERT OR UPDATE ON public.course_enrollments
FOR EACH ROW EXECUTE FUNCTION public.psp_assign_advanced_batch_v542();
REVOKE ALL ON FUNCTION public.psp_assign_advanced_batch_v542() FROM PUBLIC, anon, authenticated;

-- Historical tag-only reconciliation: these older rows contain amounts and
-- payment history that must never be repriced or re-approved by UPDATE triggers.
-- The replication-role setting is local to this transaction and is reset at COMMIT.
SET LOCAL session_replication_role = 'replica';
UPDATE public.course_enrollments
SET psp_batch_key = CASE
  WHEN created_at >= timestamptz '2026-10-01 00:00:00+05'
  THEN 'advanced_b2'
  ELSE 'advanced_b1'
END
WHERE course_key='advanced'
  AND psp_batch_key IS DISTINCT FROM CASE
    WHEN created_at >= timestamptz '2026-10-01 00:00:00+05'
    THEN 'advanced_b2'
    ELSE 'advanced_b1'
  END;

COMMIT;
