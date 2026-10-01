-- PipSePaisa V400 — Admin Team Client Monitor performance
-- Replaces per-person LATERAL scans with set-based one-row-per-person aggregates.
-- Return signature and business rules are preserved.

CREATE OR REPLACE FUNCTION public.psp_admin_team_monitor_clients_v396(
  p_team_member_id text DEFAULT NULL::text,
  p_limit integer DEFAULT 5000
)
RETURNS TABLE(
  team_member_id text,
  team_member_name text,
  user_id uuid,
  client_key text,
  client_id text,
  full_name text,
  email text,
  whatsapp text,
  assigned_at timestamptz,
  source text,
  campaign text,
  reference_code text,
  course_enrollment text,
  vip_status text,
  broker text,
  broker_status text,
  account_mode text,
  work_status text,
  follow_up_at timestamptz,
  work_note text,
  last_activity_at timestamptz,
  is_converted boolean,
  follow_up_due boolean,
  duplicate_accounts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_limit integer:=greatest(1,least(coalesce(p_limit,5000),5000));
  v_team text:=nullif(trim(coalesce(p_team_member_id,'')),'');
BEGIN
  IF NOT public.psp_is_admin() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  RETURN QUERY
  WITH owned AS MATERIALIZED (
    SELECT
      o.*,
      p.created_at AS profile_created_at,
      p.full_name AS profile_full_name,
      p.email AS profile_email,
      p.whatsapp AS profile_whatsapp,
      p.phone AS profile_phone,
      p.client_id AS profile_client_id,
      lower(regexp_replace(trim(coalesce(nullif(o.full_name,''),nullif(p.full_name,''),'')),'\\s+',' ','g')) AS name_norm,
      regexp_replace(coalesce(nullif(o.whatsapp,''),nullif(p.whatsapp,''),p.phone,''),'[^0-9]','','g') AS phone_norm
    FROM public.psp_client_owner_v273 o
    LEFT JOIN public.profiles p ON p.id=o.user_id
    WHERE v_team IS NULL OR o.team_member_id=v_team
  ),
  keyed AS MATERIALIZED (
    SELECT x.*,
      CASE
        WHEN length(x.phone_norm)>=7 AND nullif(x.name_norm,'') IS NOT NULL
          THEN coalesce(x.team_member_id,'')||':person:'||x.phone_norm||':'||x.name_norm
        ELSE coalesce(x.team_member_id,'')||':user:'||x.user_id::text
      END AS person_key
    FROM owned x
  ),
  groups AS (
    SELECT
      k.person_key,
      min(coalesce(k.assigned_at,k.profile_created_at,k.updated_at)) AS first_seen_at,
      count(*)::integer AS account_count
    FROM keyed k
    GROUP BY k.person_key
  ),
  rep AS (
    SELECT DISTINCT ON(k.person_key) k.*
    FROM keyed k
    LEFT JOIN public.psp_client_work_v273 w ON w.client_key=k.client_key
    ORDER BY
      k.person_key,
      CASE WHEN coalesce(w.status,'new')<>'new' THEN 0 ELSE 1 END,
      coalesce(w.updated_at,'epoch'::timestamptz) DESC,
      coalesce(k.assigned_at,k.profile_created_at,k.updated_at) ASC,
      k.updated_at DESC
  ),
  src AS (
    SELECT DISTINCT ON(k.person_key)
      k.person_key,
      CASE
        WHEN lower(coalesce(k.source,'')) ~ '(ad|round[ _-]*robin|auto)' THEN 'Ad / Auto'
        WHEN lower(coalesce(k.source,'')) ~ '(override|specific|manager|transfer|assignment[ _-]*sync)' THEN 'Manager Transfer'
        ELSE coalesce(nullif(k.source,''),'Assigned')
      END::text AS source_value
    FROM keyed k
    ORDER BY
      k.person_key,
      CASE
        WHEN lower(coalesce(k.source,'')) ~ '(ad|round[ _-]*robin|auto)' THEN 3
        WHEN lower(coalesce(k.source,'')) ~ '(override|specific|manager|transfer|assignment[ _-]*sync)' THEN 2
        ELSE 1
      END DESC,
      k.updated_at DESC
  ),
  attr AS (
    SELECT DISTINCT ON(k.person_key)
      k.person_key,
      a.campaign::text AS campaign_value,
      a.reference_code::text AS reference_code_value
    FROM public.team_client_attribution_v206 a
    JOIN keyed k ON k.user_id=a.user_id
    ORDER BY k.person_key,a.attributed_at DESC,a.updated_at DESC NULLS LAST
  ),
  course_rows AS (
    SELECT DISTINCT
      k.person_key,
      (coalesce(nullif(ce.course_name,''),nullif(ce.course_key,''),'Course')
        ||CASE
            WHEN nullif(trim(coalesce(ce.psp_batch_key,'')),'') IS NOT NULL
              THEN ' ['||lower(trim(ce.psp_batch_key))||']'
            ELSE ''
          END)::text AS label,
      (
        lower(coalesce(ce.enrollment_status,''))='enrolled'
        OR lower(coalesce(ce.payment_status,'')) IN ('approved','paid','success','successful','completed','accepted')
        OR lower(coalesce(ce.provider_status,'')) IN ('approved','paid','success','successful','completed','accepted')
      ) AS is_active
    FROM public.course_enrollments ce
    JOIN keyed k ON k.user_id=ce.user_id
    WHERE lower(coalesce(ce.enrollment_status,'')) NOT IN ('cancelled','canceled','rejected','revoked')
      AND lower(coalesce(ce.payment_status,'')) NOT IN ('rejected','revoked')
  ),
  crs AS (
    SELECT
      person_key,
      string_agg(label,', ' ORDER BY label)::text AS courses,
      bool_or(is_active) AS has_active_course
    FROM course_rows
    GROUP BY person_key
  ),
  vip AS (
    SELECT k.person_key,true AS is_vip
    FROM public.payment_requests pr
    JOIN keyed k ON k.user_id=pr.user_id
    WHERE lower(coalesce(pr.status,'')) IN ('approved','paid','success','successful','completed','accepted','confirmed','verified')
      AND (
        lower(coalesce(to_jsonb(pr)->>'plan_name','')) LIKE '%vip%'
        OR lower(coalesce(pr.request_type,'')) LIKE '%vip%'
        OR coalesce(pr.amount,0)=50
      )
    GROUP BY k.person_key
  ),
  br AS (
    SELECT DISTINCT ON(k.person_key)
      k.person_key,
      upper(coalesce(nullif(av.broker,''),'—'))::text AS broker_value,
      CASE
        WHEN lower(coalesce(av.submission_status,'')) IN ('approved','accepted','verified','completed')
          THEN 'Approved'
        ELSE initcap(coalesce(nullif(av.submission_status,''),'Pending'))
      END::text AS broker_status_value,
      CASE
        WHEN coalesce(av.existing_account,false) THEN 'IB Shift'
        ELSE 'New Account'
      END::text AS account_mode_value,
      (lower(coalesce(av.submission_status,'')) IN ('approved','accepted','verified','completed')) AS is_approved
    FROM public.account_verifications av
    JOIN keyed k ON k.user_id=av.user_id
    ORDER BY
      k.person_key,
      coalesce(av.reviewed_at,av.updated_at,av.submitted_at,av.created_at) DESC
  ),
  wrk AS (
    SELECT DISTINCT ON(k.person_key)
      k.person_key,
      w.status AS status_value,
      w.follow_up_at AS follow_up_at_value,
      w.note AS note_value,
      w.updated_at AS updated_at_value
    FROM public.psp_client_work_v273 w
    JOIN keyed k ON k.client_key=w.client_key
    ORDER BY k.person_key,w.updated_at DESC
  )
  SELECT
    r.team_member_id::text,
    coalesce(nullif(tm.display_name,''),nullif(tm.username,''),'Team Member')::text,
    r.user_id,
    r.client_key::text,
    coalesce(
      nullif(r.client_id,''),
      nullif(r.profile_client_id,''),
      'PSP-'||upper(substr(replace(r.user_id::text,'-',''),1,8))
    )::text,
    coalesce(
      nullif(r.full_name,''),
      nullif(r.profile_full_name,''),
      split_part(coalesce(r.email,r.profile_email,''),'@',1),
      'Client'
    )::text,
    coalesce(nullif(r.email,''),r.profile_email,'')::text,
    coalesce(nullif(r.whatsapp,''),nullif(r.profile_whatsapp,''),r.profile_phone,'')::text,
    g.first_seen_at::timestamptz,
    coalesce(src.source_value,'Assigned')::text,
    coalesce(nullif(attr.campaign_value,''),'Current Assignment')::text,
    coalesce(nullif(attr.reference_code_value,''),'OWNER')::text,
    coalesce(crs.courses,'No course yet')::text,
    CASE WHEN coalesce(vip.is_vip,false) THEN 'VIP' ELSE 'Not VIP' END::text,
    coalesce(br.broker_value,'—')::text,
    coalesce(br.broker_status_value,'—')::text,
    coalesce(br.account_mode_value,'—')::text,
    coalesce(wrk.status_value,'new')::text,
    wrk.follow_up_at_value,
    wrk.note_value::text,
    wrk.updated_at_value,
    (
      coalesce(crs.has_active_course,false)
      OR coalesce(vip.is_vip,false)
      OR coalesce(br.is_approved,false)
    )::boolean,
    (
      coalesce(wrk.status_value,'new')='follow_up'
      AND wrk.follow_up_at_value IS NOT NULL
      AND wrk.follow_up_at_value<=clock_timestamp()
    )::boolean,
    g.account_count
  FROM rep r
  JOIN groups g ON g.person_key=r.person_key
  LEFT JOIN public.team_members tm ON tm.id::text=r.team_member_id
  LEFT JOIN src ON src.person_key=r.person_key
  LEFT JOIN attr ON attr.person_key=r.person_key
  LEFT JOIN crs ON crs.person_key=r.person_key
  LEFT JOIN vip ON vip.person_key=r.person_key
  LEFT JOIN br ON br.person_key=r.person_key
  LEFT JOIN wrk ON wrk.person_key=r.person_key
  ORDER BY g.first_seen_at DESC NULLS LAST,r.client_key
  LIMIT v_limit;
END;
$function$;
