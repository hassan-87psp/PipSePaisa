-- PipSePaisa V405 — fast Admin user export
-- Replaces per-profile LATERAL lookups with set-based "first/latest per user" datasets.

CREATE OR REPLACE FUNCTION public.psp_admin_user_export_v299()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  whatsapp text,
  client_id text,
  role text,
  registration_link_name text,
  registration_source text,
  registration_campaign text,
  referral_slug text,
  client_owner text,
  joined_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.psp_is_admin() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  RETURN QUERY
  WITH link_first AS (
    SELECT DISTINCT ON(e.user_id)
      e.user_id,
      tl.name::text AS link_name,
      tl.source::text AS link_source,
      tl.campaign::text AS link_campaign,
      tl.slug::text AS link_slug,
      tl.assigned_team_name::text AS assigned_team_name
    FROM public.tracked_link_events e
    JOIN public.tracked_links tl ON tl.id=e.link_id
    WHERE e.user_id IS NOT NULL
    ORDER BY
      e.user_id,
      CASE WHEN lower(coalesce(e.event_type,''))='signup' THEN 0 ELSE 1 END,
      e.created_at ASC NULLS LAST
  ),
  lead_latest AS (
    SELECT DISTINCT ON(a.user_id)
      a.user_id,
      a.team_member_name::text AS team_member_name
    FROM public.psp_lead_assignments a
    WHERE a.user_id IS NOT NULL
    ORDER BY a.user_id,a.assigned_at DESC NULLS LAST
  ),
  override_latest AS (
    SELECT DISTINCT ON(o.user_id)
      o.user_id,
      coalesce(
        nullif(trim(t.display_name),''),
        nullif(trim(t.username),''),
        o.team_member_id
      )::text AS manager_name
    FROM public.psp_client_manager_override_v281 o
    LEFT JOIN public.team_members t ON t.id::text=o.team_member_id::text
    WHERE o.user_id IS NOT NULL
    ORDER BY o.user_id,o.changed_at DESC NULLS LAST
  )
  SELECT
    p.id AS user_id,
    coalesce(
      nullif(trim(to_jsonb(p)->>'full_name'),''),
      split_part(coalesce(to_jsonb(p)->>'email',''),'@',1),
      'User'
    )::text AS full_name,
    coalesce(to_jsonb(p)->>'email','')::text AS email,
    coalesce(
      nullif(trim(to_jsonb(p)->>'whatsapp'),''),
      nullif(trim(to_jsonb(p)->>'whatsapp_number'),''),
      nullif(trim(to_jsonb(p)->>'phone'),''),
      nullif(trim(to_jsonb(p)->>'mobile'),''),
      ''
    )::text AS whatsapp,
    coalesce(nullif(trim(to_jsonb(p)->>'client_id'),''),'')::text AS client_id,
    coalesce(nullif(trim(to_jsonb(p)->>'role'),''),'user')::text AS role,
    coalesce(nullif(trim(lk.link_name),''),'Direct / Organic')::text AS registration_link_name,
    coalesce(
      nullif(trim(lk.link_source),''),
      CASE WHEN lk.link_name IS NULL THEN 'Direct' ELSE 'Tracked Link' END
    )::text AS registration_source,
    coalesce(lk.link_campaign,'')::text AS registration_campaign,
    coalesce(lk.link_slug,'')::text AS referral_slug,
    coalesce(
      nullif(trim(ov.manager_name),''),
      nullif(trim(la.team_member_name),''),
      nullif(trim(lk.assigned_team_name),''),
      'Direct'
    )::text AS client_owner,
    p.created_at AS joined_at
  FROM public.profiles p
  LEFT JOIN link_first lk ON lk.user_id=p.id
  LEFT JOIN lead_latest la ON la.user_id=p.id
  LEFT JOIN override_latest ov ON ov.user_id=p.id
  ORDER BY p.created_at DESC NULLS LAST;
END;
$function$;