-- PipSePaisa 510 | narrow surplus PUBLIC EXECUTE on nine Team SECURITY DEFINER RPCs
-- Defensive privilege only: never updates data, statuses, UI, or function definitions.
-- Existing explicitly granted anon/authenticated/service_role permissions stay untouched.
-- Requires exact previously-audited ACL shape. Rollback: GRANT EXECUTE ON FUNCTION <signature> TO PUBLIC;
BEGIN;

DO $guard$
DECLARE
  signature text;
  func_oid oid;
  access_ok boolean;
  funcs text[] := ARRAY[
    'public.psp_team_client_export_v359(text,integer)',
    'public.psp_team_clients_v355(text,integer)',
    'public.psp_team_clients_v359(text,integer)',
    'public.psp_team_daily_history_v355(text,integer,integer)',
    'public.psp_team_history_v385(text,integer,integer,integer)',
    'public.psp_team_paid_course_clients_v377(text,integer,integer)',
    'public.psp_team_performance_range_v359(text,date,date)',
    'public.psp_team_search_client_v359(text,text,integer)',
    'public.psp_team_update_client_work_v359(text,text,text,timestamp with time zone,text)'
  ];
BEGIN
  FOREACH signature IN ARRAY funcs LOOP
    func_oid := to_regprocedure(signature);
    IF func_oid IS NULL THEN RAISE EXCEPTION 'Missing function: %', signature; END IF;
    SELECT p.prosecdef
      AND EXISTS(SELECT 1 FROM aclexplode(p.proacl) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE')
      AND (SELECT count(DISTINCT r.rolname) FROM aclexplode(p.proacl) a
           JOIN pg_roles r ON r.oid=a.grantee
           WHERE r.rolname IN ('anon','authenticated','service_role')
             AND a.privilege_type='EXECUTE') = 3
    INTO access_ok
    FROM pg_proc p WHERE p.oid=func_oid;
    IF access_ok IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'Unexpected ACL/security-definer state for %, refusing to modify', signature;
    END IF;
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', func_oid::regprocedure);
  END LOOP;
END
$guard$;

COMMIT;
