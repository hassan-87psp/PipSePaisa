-- PipSePaisa V404 — Admin Team custom/range performance cache
-- Keeps the existing range metrics contract while avoiding repeated expensive recalculation.

CREATE TABLE IF NOT EXISTS public.team_range_cache_v404(
  team_member_id text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  snapshot jsonb NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(team_member_id,start_date,end_date)
);

CREATE INDEX IF NOT EXISTS team_range_cache_v404_dates_idx
  ON public.team_range_cache_v404(end_date DESC,start_date DESC);

REVOKE ALL ON public.team_range_cache_v404 FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.psp_admin_team_performance_range_compute_v404(
  p_team_member_id text,
  p_start_date date,
  p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_team text:=nullif(trim(coalesce(p_team_member_id,'')),'');
  sd date:=coalesce(p_start_date,(now() at time zone 'Asia/Kuala_Lumpur')::date);
  ed date:=coalesce(p_end_date,coalesce(p_start_date,(now() at time zone 'Asia/Kuala_Lumpur')::date));
  sts timestamptz;
  ets timestamptz;
  base jsonb;
  b1 integer:=0;b2 integer:=0;b3 integer:=0;
  f1 integer:=0;f2 integer:=0;fund integer:=0;
  adv integer:=0;advfund integer:=0;
BEGIN
  IF v_team IS NULL THEN RAISE EXCEPTION 'Team member is required.'; END IF;
  IF ed<sd THEN RAISE EXCEPTION 'End date cannot be before start date.'; END IF;
  IF ed-sd>370 THEN RAISE EXCEPTION 'Custom range cannot exceed 371 days.'; END IF;

  base:=public.psp_team_performance_range_core_v207(v_team,sd,ed)
        || public.psp_team_client_cohort_stats_v209(v_team,sd,ed+1);
  sts:=sd::timestamp at time zone 'Asia/Kuala_Lumpur';
  ets:=(ed+1)::timestamp at time zone 'Asia/Kuala_Lumpur';

  WITH ok AS (
    SELECT
      ce.user_id,
      a.attributed_at,
      lower(coalesce(ce.psp_batch_key,'')) AS batch_key,
      CASE
        WHEN lower(coalesce(ce.course_segment,'')) IN ('advance_fundamental','advanced_fundamental')
          OR lower(coalesce(ce.course_key,'')) IN ('advance-fundamental','advanced-fundamental','advance_fundamental','advanced_fundamental')
          OR lower(coalesce(ce.course_name,'')) LIKE '%advance%fundamental%'
          OR lower(coalesce(ce.course_name,'')) LIKE '%advanced%fundamental%'
          THEN 'advance_fundamental'
        WHEN lower(coalesce(ce.course_segment,''))='fundamental'
          OR lower(coalesce(ce.course_key,''))='fundamental'
          OR lower(coalesce(ce.course_name,'')) LIKE '%fundamental%'
          THEN 'fundamental'
        WHEN lower(coalesce(ce.course_segment,''))='advanced'
          OR lower(coalesce(ce.course_key,''))='advanced'
          OR lower(coalesce(ce.course_name,'')) LIKE '%advanced%'
          THEN 'advanced'
        WHEN lower(coalesce(ce.course_segment,'')) IN ('batch1','batch2','batch3')
          OR lower(coalesce(ce.course_key,'')) LIKE 'basic%'
          OR lower(coalesce(ce.course_name,'')) LIKE '%basic forex course%'
          OR lower(coalesce(ce.course_name,'')) LIKE '%free course%'
          THEN 'free'
        ELSE 'other'
      END AS family
    FROM public.course_enrollments ce
    LEFT JOIN public.team_client_attribution_v206 a ON a.user_id=ce.user_id
    CROSS JOIN LATERAL (
      SELECT public.psp_course_paid_event_at_v371(ce.id) AS event_at
    ) ev
    WHERE public.psp_team_member_at_event_v371(ce.user_id,ev.event_at)=v_team
      AND (
        lower(coalesce(ce.enrollment_status,''))='enrolled'
        OR lower(coalesce(ce.payment_status,'')) IN ('approved','paid','success','successful','completed','accepted')
        OR lower(coalesce(ce.provider_status,'')) IN ('approved','paid','success','successful','completed','accepted')
      )
      AND ev.event_at>=sts
      AND ev.event_at<ets
  )
  SELECT
    count(DISTINCT user_id) FILTER(
      WHERE family='free' AND (
        batch_key='basic_b1'
        OR (
          batch_key NOT IN ('basic_b1','basic_b2','basic_b3')
          AND (attributed_at at time zone 'Asia/Kuala_Lumpur')::date<date '2026-09-01'
        )
      )
    )::integer,
    count(DISTINCT user_id) FILTER(
      WHERE family='free' AND (
        batch_key='basic_b2'
        OR (
          batch_key NOT IN ('basic_b1','basic_b2','basic_b3')
          AND (attributed_at at time zone 'Asia/Kuala_Lumpur')::date>=date '2026-09-01'
          AND (attributed_at at time zone 'Asia/Kuala_Lumpur')::date<date '2026-09-16'
        )
      )
    )::integer,
    count(DISTINCT user_id) FILTER(
      WHERE family='free' AND (
        batch_key='basic_b3'
        OR (
          batch_key NOT IN ('basic_b1','basic_b2','basic_b3')
          AND (attributed_at at time zone 'Asia/Kuala_Lumpur')::date>=date '2026-09-16'
        )
      )
    )::integer,
    count(DISTINCT user_id) FILTER(WHERE family='fundamental')::integer,
    count(DISTINCT user_id) FILTER(
      WHERE family='fundamental' AND (
        batch_key='fundamental_b1'
        OR (
          batch_key NOT IN ('fundamental_b1','fundamental_b2')
          AND (attributed_at at time zone 'Asia/Kuala_Lumpur')::date<date '2026-09-16'
        )
      )
    )::integer,
    count(DISTINCT user_id) FILTER(
      WHERE family='fundamental' AND (
        batch_key='fundamental_b2'
        OR (
          batch_key NOT IN ('fundamental_b1','fundamental_b2')
          AND (attributed_at at time zone 'Asia/Kuala_Lumpur')::date>=date '2026-09-16'
        )
      )
    )::integer,
    count(DISTINCT user_id) FILTER(WHERE family='advanced')::integer,
    count(DISTINCT user_id) FILTER(WHERE family='advance_fundamental')::integer
  INTO b1,b2,b3,fund,f1,f2,adv,advfund
  FROM ok;

  RETURN coalesce(base,'{}'::jsonb) || jsonb_build_object(
    'batch1_users',coalesce(b1,0),
    'batch2_users',coalesce(b2,0),
    'batch3_users',coalesce(b3,0),
    'fundamental_users',coalesce(fund,0),
    'fundamental_b1_users',coalesce(f1,0),
    'fundamental_b2_users',coalesce(f2,0),
    'advance_users',coalesce(adv,0),
    'advance_fundamental_users',coalesce(advfund,0),
    'course_total',
      coalesce(b1,0)+coalesce(b2,0)+coalesce(b3,0)+
      coalesce(fund,0)+coalesce(adv,0)+coalesce(advfund,0)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.psp_admin_team_performance_range_compute_v404(text,date,date)
FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.psp_admin_team_performance_range_v396(
  p_team_member_id text,
  p_start_date date,
  p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_team text:=nullif(trim(coalesce(p_team_member_id,'')),'');
  sd date:=coalesce(p_start_date,(now() at time zone 'Asia/Kuala_Lumpur')::date);
  ed date:=coalesce(p_end_date,coalesce(p_start_date,(now() at time zone 'Asia/Kuala_Lumpur')::date));
  v_snapshot jsonb;
  v_computed timestamptz;
BEGIN
  IF NOT public.psp_is_admin() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;
  IF v_team IS NULL THEN RAISE EXCEPTION 'Team member is required.'; END IF;
  IF ed<sd THEN RAISE EXCEPTION 'End date cannot be before start date.'; END IF;
  IF ed-sd>370 THEN RAISE EXCEPTION 'Custom range cannot exceed 371 days.'; END IF;

  SELECT c.snapshot,c.computed_at
    INTO v_snapshot,v_computed
  FROM public.team_range_cache_v404 c
  WHERE c.team_member_id=v_team
    AND c.start_date=sd
    AND c.end_date=ed;

  IF v_snapshot IS NOT NULL
     AND v_computed>=clock_timestamp()-interval '5 minutes'
  THEN
    RETURN v_snapshot;
  END IF;

  v_snapshot:=public.psp_admin_team_performance_range_compute_v404(v_team,sd,ed);

  INSERT INTO public.team_range_cache_v404(team_member_id,start_date,end_date,snapshot,computed_at)
  VALUES(v_team,sd,ed,v_snapshot,clock_timestamp())
  ON CONFLICT(team_member_id,start_date,end_date) DO UPDATE
    SET snapshot=excluded.snapshot,
        computed_at=excluded.computed_at;

  RETURN v_snapshot;
END;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_range_cache_invalidate_v404()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  DELETE FROM public.team_range_cache_v404;
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
    'team_broker_weekly_v207',
    'tracked_link_events',
    'tracked_links',
    'psp_client_manager_override_v281',
    'psp_lead_assignments',
    'psp_ad_submissions_v259',
    'team_performance_monthly_v206'
  ]
  LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS psp_team_range_cache_v404 ON public.%I',t);
      EXECUTE format(
        'CREATE TRIGGER psp_team_range_cache_v404 AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.psp_team_range_cache_invalidate_v404()',
        t
      );
    END IF;
  END LOOP;
END;
$do$;

REVOKE ALL ON FUNCTION public.psp_team_range_cache_invalidate_v404()
FROM PUBLIC,anon,authenticated;