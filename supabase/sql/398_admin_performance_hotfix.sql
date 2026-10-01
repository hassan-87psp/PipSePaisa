-- PipSePaisa V398 — Admin performance hotfix
-- Rewrites tracked-link statistics as set-based aggregation.
-- Keeps the existing output contract while removing the per-signup correlated enrollment scan.

CREATE OR REPLACE VIEW public.tracked_link_stats_v211 AS
WITH base AS (
  SELECT e.link_id, e.event_type, e.user_id, e.visitor_id, e.session_id, e.created_at
  FROM public.tracked_link_events e
  WHERE lower(coalesce(e.event_type,'')) IN (
    'click','visit','pageview','signup','registration','enrollment','course_enrollment','enrolled'
  )
),
click_stats AS (
  SELECT
    b.link_id::text AS link_id,
    count(*) FILTER (
      WHERE lower(coalesce(b.event_type,'')) IN ('click','visit','pageview')
    ) AS total_clicks,
    count(DISTINCT coalesce(
      nullif(b.visitor_id,''),
      nullif(b.user_id::text,''),
      nullif(b.session_id,'')
    )) FILTER (
      WHERE lower(coalesce(b.event_type,'')) IN ('click','visit','pageview')
    ) AS unique_visitors
  FROM base b
  GROUP BY b.link_id::text
),
signup_cohort AS (
  SELECT DISTINCT ON (
    b.link_id::text,
    coalesce(nullif(b.user_id::text,''),'visitor:'||nullif(b.visitor_id,''))
  )
    b.link_id::text AS link_id,
    nullif(b.user_id::text,'') AS user_id,
    nullif(b.visitor_id,'') AS visitor_id,
    coalesce(nullif(b.user_id::text,''),'visitor:'||nullif(b.visitor_id,'')) AS signup_key,
    b.created_at AS signup_at
  FROM base b
  WHERE lower(coalesce(b.event_type,'')) IN ('signup','registration')
    AND (
      nullif(b.user_id::text,'') IS NOT NULL
      OR nullif(b.visitor_id,'') IS NOT NULL
    )
  ORDER BY
    b.link_id::text,
    coalesce(nullif(b.user_id::text,''),'visitor:'||nullif(b.visitor_id,'')),
    b.created_at
),
signup_keys AS (
  SELECT link_id,signup_key,signup_at,'u:'||user_id AS match_key
  FROM signup_cohort
  WHERE user_id IS NOT NULL
  UNION ALL
  SELECT link_id,signup_key,signup_at,'v:'||visitor_id AS match_key
  FROM signup_cohort
  WHERE visitor_id IS NOT NULL
),
enrollment_keys AS (
  SELECT z.link_id,z.match_key,max(z.created_at) AS last_enrollment_at
  FROM (
    SELECT
      b.link_id::text AS link_id,
      'u:'||b.user_id::text AS match_key,
      b.created_at
    FROM base b
    WHERE lower(coalesce(b.event_type,'')) IN ('enrollment','course_enrollment','enrolled')
      AND b.user_id IS NOT NULL
    UNION ALL
    SELECT
      b.link_id::text AS link_id,
      'v:'||b.visitor_id AS match_key,
      b.created_at
    FROM base b
    WHERE lower(coalesce(b.event_type,'')) IN ('enrollment','course_enrollment','enrolled')
      AND nullif(b.visitor_id,'') IS NOT NULL
  ) z
  GROUP BY z.link_id,z.match_key
),
cohort_status AS (
  SELECT
    sk.link_id,
    sk.signup_key,
    bool_or(ek.last_enrollment_at>=sk.signup_at) AS enrolled
  FROM signup_keys sk
  LEFT JOIN enrollment_keys ek
    ON ek.link_id=sk.link_id
   AND ek.match_key=sk.match_key
  GROUP BY sk.link_id,sk.signup_key
),
cohort_agg AS (
  SELECT
    link_id,
    count(*) AS signups,
    count(*) FILTER (WHERE enrolled) AS enrollments
  FROM cohort_status
  GROUP BY link_id
)
SELECT
  tl.id,
  tl.name,
  tl.slug,
  tl.destination_path,
  tl.destination_label,
  tl.source,
  tl.campaign,
  tl.medium,
  tl.notes,
  tl.is_active,
  tl.created_by,
  tl.created_at,
  tl.updated_at,
  tl.whatsapp_number,
  tl.assigned_team_member_id,
  tl.assigned_team_username,
  tl.assigned_team_name,
  coalesce(cs.total_clicks,0::bigint) AS total_clicks,
  coalesce(cs.unique_visitors,0::bigint) AS unique_visitors,
  coalesce(ca.signups,0::bigint) AS signups,
  least(
    coalesce(ca.enrollments,0::bigint),
    coalesce(ca.signups,0::bigint)
  ) AS enrollments,
  CASE
    WHEN coalesce(ca.signups,0::bigint)>0 THEN
      round(
        least(
          100::numeric,
          least(
            coalesce(ca.enrollments,0::bigint),
            coalesce(ca.signups,0::bigint)
          )::numeric*100::numeric/ca.signups::numeric
        ),
        1
      )
    ELSE 0::numeric
  END AS conversion_rate
FROM public.tracked_links tl
LEFT JOIN click_stats cs ON cs.link_id=tl.id::text
LEFT JOIN cohort_agg ca ON ca.link_id=tl.id::text;