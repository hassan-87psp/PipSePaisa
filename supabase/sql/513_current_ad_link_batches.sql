-- Production-safe, forward-only cohort alignment for new Ad Link enrollments.
-- No existing course_enrollments or ad submission rows are modified.
DO $migration$
DECLARE
  signature text;
  src text;
BEGIN
  FOREACH signature IN ARRAY ARRAY['public.psp_ad_ensure_enrollment_v268(uuid,text,text,text,text)','public.psp_ad_complete_enrollment_v259(uuid,text,text,text,text,text,text,text,text,text,text)'] LOOP
    SELECT pg_get_functiondef(to_regprocedure(signature)) INTO src;
    IF src IS NULL THEN
      RAISE EXCEPTION 'Missing required function: %',signature;
    END IF;
    IF strpos(src, 'v_batch_key:=''basic_b3''') = 0 THEN
      RAISE EXCEPTION 'Unexpected function body for %: v_batch_key:=''basic_b3''',signature;
    END IF;
    src := replace(src, 'v_batch_key:=''basic_b3''', 'v_batch_key:=''basic_b4''');
    IF strpos(src, 'v_batch_key:=''fundamental_b2''') = 0 THEN
      RAISE EXCEPTION 'Unexpected function body for %: v_batch_key:=''fundamental_b2''',signature;
    END IF;
    src := replace(src, 'v_batch_key:=''fundamental_b2''', 'v_batch_key:=''fundamental_b3''');
    IF strpos(src, 'v_course_name:=''Sir Sajid Khan Ghori Free Course — Batch 3''') = 0 THEN
      RAISE EXCEPTION 'Unexpected function body for %: v_course_name:=''Sir Sajid Khan Ghori Free Course — Batch 3''',signature;
    END IF;
    src := replace(src, 'v_course_name:=''Sir Sajid Khan Ghori Free Course — Batch 3''', 'v_course_name:=''Basic Forex Course — Batch 4''');
    IF strpos(src, 'v_course_name:=''Sir Malik Ghulam Abbas Free Course — Batch 2''') = 0 THEN
      RAISE EXCEPTION 'Unexpected function body for %: v_course_name:=''Sir Malik Ghulam Abbas Free Course — Batch 2''',signature;
    END IF;
    src := replace(src, 'v_course_name:=''Sir Malik Ghulam Abbas Free Course — Batch 2''', 'v_course_name:=''Fundamental Forex Course — Batch 3''');
    EXECUTE src;
  END LOOP;
END
$migration$;
