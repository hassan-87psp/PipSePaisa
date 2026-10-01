-- PipSePaisa V403 — Admin Team Daily report cache
-- Caches only the expensive auto-calculated JSON. Manual daily activity remains live.
-- Relevant writes invalidate recent cached dates; manager ownership override clears all.

CREATE TABLE IF NOT EXISTS public.team_daily_auto_cache_v403(
  team_member_id text NOT NULL,
  report_date date NOT NULL,
  snapshot jsonb NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(team_member_id,report_date)
);

CREATE INDEX IF NOT EXISTS team_daily_auto_cache_v403_date_idx
  ON public.team_daily_auto_cache_v403(report_date DESC);

REVOKE ALL ON public.team_daily_auto_cache_v403 FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.psp_team_daily_auto_cached_v403(
  p_team_member_id text,
  p_report_date date,
  p_max_age_seconds integer DEFAULT 300
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  d date:=coalesce(p_report_date,(now() at time zone 'Asia/Kuala_Lumpur')::date);
  today_my date:=(now() at time zone 'Asia/Kuala_Lumpur')::date;
  v_snapshot jsonb;
  v_computed timestamptz;
  v_age integer:=greatest(0,least(coalesce(p_max_age_seconds,300),86400));
BEGIN
  IF nullif(trim(coalesce(p_team_member_id,'')),'') IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT c.snapshot,c.computed_at
    INTO v_snapshot,v_computed
  FROM public.team_daily_auto_cache_v403 c
  WHERE c.team_member_id=p_team_member_id
    AND c.report_date=d;

  IF v_snapshot IS NOT NULL
     AND (
       d<today_my
       OR v_computed>=clock_timestamp()-make_interval(secs=>v_age)
     )
  THEN
    RETURN v_snapshot;
  END IF;

  v_snapshot:=public.psp_team_daily_auto_core_v207(p_team_member_id,d);

  INSERT INTO public.team_daily_auto_cache_v403(team_member_id,report_date,snapshot,computed_at)
  VALUES(p_team_member_id,d,v_snapshot,clock_timestamp())
  ON CONFLICT(team_member_id,report_date) DO UPDATE
    SET snapshot=excluded.snapshot,
        computed_at=excluded.computed_at;

  RETURN v_snapshot;
END;
$function$;

REVOKE ALL ON FUNCTION public.psp_team_daily_auto_cached_v403(text,date,integer)
FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.psp_admin_team_daily_reports_v207(
  p_report_date date DEFAULT NULL::date,
  p_team_member_id text DEFAULT NULL::text
)
RETURNS TABLE(
  team_member_id text,
  display_name text,
  username text,
  is_active boolean,
  report_date date,
  manual jsonb,
  auto jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  d date:=coalesce(p_report_date,(now() at time zone 'Asia/Kuala_Lumpur')::date);
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
    d,
    coalesce(
      to_jsonb(r),
      jsonb_build_object(
        'report_date',d,
        'leads',0,
        'messages_sent',0,
        'calls_made',0,
        'follow_ups',0,
        'note',null,
        'submitted',false
      )
    ),
    public.psp_team_daily_auto_cached_v403(tm.id::text,d,300)
  FROM public.team_members tm
  LEFT JOIN public.team_daily_activity_v206 r
    ON r.team_member_id=tm.id::text
   AND r.report_date=d
  WHERE p_team_member_id IS NULL OR tm.id::text=p_team_member_id
  ORDER BY coalesce(tm.is_active,true) DESC,
           lower(coalesce(tm.display_name,tm.username,''));
END;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_daily_cache_invalidate_recent_v403()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  today_my date:=(now() at time zone 'Asia/Kuala_Lumpur')::date;
BEGIN
  DELETE FROM public.team_daily_auto_cache_v403
  WHERE report_date>=today_my-31;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_daily_cache_invalidate_all_v403()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  DELETE FROM public.team_daily_auto_cache_v403;
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
    'team_client_attribution_v206',
    'team_broker_daily_v206',
    'team_broker_weekly_v207'
  ]
  LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS psp_team_daily_cache_recent_v403 ON public.%I',t);
      EXECUTE format(
        'CREATE TRIGGER psp_team_daily_cache_recent_v403 AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.psp_team_daily_cache_invalidate_recent_v403()',
        t
      );
    END IF;
  END LOOP;

  IF to_regclass('public.psp_client_manager_override_v281') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS psp_team_daily_cache_all_v403 ON public.psp_client_manager_override_v281;
    CREATE TRIGGER psp_team_daily_cache_all_v403
    AFTER INSERT OR UPDATE OR DELETE ON public.psp_client_manager_override_v281
    FOR EACH STATEMENT EXECUTE FUNCTION public.psp_team_daily_cache_invalidate_all_v403();
  END IF;
END;
$do$;

REVOKE ALL ON FUNCTION public.psp_team_daily_cache_invalidate_recent_v403()
FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.psp_team_daily_cache_invalidate_all_v403()
FROM PUBLIC,anon,authenticated;