-- PipSePaisa V399 — Admin Team Performance cache bridge
-- Reuses the exact Team history snapshot cache for Admin overview/history.
-- Current-month snapshots refresh at most every 15 minutes.
-- Relevant business writes invalidate recent snapshots; manager overrides invalidate all months.

CREATE OR REPLACE FUNCTION public.psp_team_snapshot_cached_v399(
  p_team_member_id text,
  p_period_month date,
  p_max_age_seconds integer DEFAULT 900
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_month date:=date_trunc('month',coalesce(p_period_month,(now() at time zone 'Asia/Kuala_Lumpur')::date))::date;
  v_next date;
  v_current date:=date_trunc('month',(now() at time zone 'Asia/Kuala_Lumpur')::date)::date;
  v_snapshot jsonb;
  v_computed timestamptz;
  v_age integer:=greatest(0,least(coalesce(p_max_age_seconds,900),86400));
BEGIN
  IF nullif(trim(coalesce(p_team_member_id,'')),'') IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  v_next:=(v_month+interval '1 month')::date;

  SELECT c.snapshot,c.computed_at
    INTO v_snapshot,v_computed
  FROM public.team_history_cache_v385 c
  WHERE c.team_member_id=p_team_member_id
    AND c.period_month=v_month;

  IF v_snapshot IS NOT NULL
     AND (
       v_month<v_current
       OR v_computed>=clock_timestamp()-make_interval(secs=>v_age)
     )
  THEN
    RETURN v_snapshot;
  END IF;

  v_snapshot:=
    public.psp_team_metrics_core_v207(p_team_member_id,v_month)
    || public.psp_team_client_cohort_stats_v209(p_team_member_id,v_month,v_next);

  INSERT INTO public.team_history_cache_v385(team_member_id,period_month,snapshot,computed_at)
  VALUES(p_team_member_id,v_month,v_snapshot,clock_timestamp())
  ON CONFLICT(team_member_id,period_month) DO UPDATE
    SET snapshot=excluded.snapshot,
        computed_at=excluded.computed_at;

  RETURN v_snapshot;
END;
$function$;

REVOKE ALL ON FUNCTION public.psp_team_snapshot_cached_v399(text,date,integer)
FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.psp_admin_team_overview_v207(p_period_month date DEFAULT NULL::date)
RETURNS TABLE(team_member_id text, display_name text, username text, is_active boolean, metrics jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  d date:=date_trunc('month',coalesce(p_period_month,(now() at time zone 'Asia/Kuala_Lumpur')::date))::date;
BEGIN
  IF NOT public.psp_is_admin() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  RETURN QUERY
  SELECT
    tm.id::text,
    tm.display_name::text,
    tm.username::text,
    coalesce(tm.is_active,true),
    public.psp_team_snapshot_cached_v399(tm.id::text,d,900)
  FROM public.team_members tm
  ORDER BY coalesce(tm.is_active,true) DESC,
           lower(coalesce(tm.display_name,tm.username,''));
END;
$function$;

CREATE OR REPLACE FUNCTION public.psp_admin_team_history_v207(
  p_team_member_id text,
  p_months integer DEFAULT 12
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  n integer:=greatest(1,least(coalesce(p_months,12),24));
  i integer;
  d date;
  arr jsonb:='[]'::jsonb;
BEGIN
  IF NOT public.psp_is_admin() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  FOR i IN 0..n-1 LOOP
    d:=(date_trunc('month',(now() at time zone 'Asia/Kuala_Lumpur')::date)-(i||' month')::interval)::date;
    arr:=arr||jsonb_build_array(
      public.psp_team_snapshot_cached_v399(p_team_member_id,d,900)
    );
  END LOOP;

  RETURN arr;
END;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_cache_invalidate_recent_v399()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_current date:=date_trunc('month',(now() at time zone 'Asia/Kuala_Lumpur')::date)::date;
BEGIN
  DELETE FROM public.team_history_cache_v385
  WHERE period_month>=((v_current-interval '2 months')::date);
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_cache_invalidate_all_v399()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  DELETE FROM public.team_history_cache_v385;
  RETURN NULL;
END;
$function$;

DO $do$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'course_enrollments',
    'course_payments',
    'payment_requests',
    'account_verifications',
    'team_broker_weekly_v207',
    'team_performance_monthly_v206',
    'tracked_links',
    'team_client_attribution_v206',
    'psp_client_owner_v273',
    'psp_ad_submissions_v259'
  ]
  LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS psp_team_cache_recent_v399 ON public.%I',t);
      EXECUTE format(
        'CREATE TRIGGER psp_team_cache_recent_v399 AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.psp_team_cache_invalidate_recent_v399()',
        t
      );
    END IF;
  END LOOP;

  IF to_regclass('public.psp_client_manager_override_v281') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS psp_team_cache_all_v399 ON public.psp_client_manager_override_v281;
    CREATE TRIGGER psp_team_cache_all_v399
    AFTER INSERT OR UPDATE OR DELETE ON public.psp_client_manager_override_v281
    FOR EACH STATEMENT EXECUTE FUNCTION public.psp_team_cache_invalidate_all_v399();
  END IF;
END;
$do$;

REVOKE ALL ON FUNCTION public.psp_team_cache_invalidate_recent_v399() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.psp_team_cache_invalidate_all_v399() FROM PUBLIC,anon,authenticated;
