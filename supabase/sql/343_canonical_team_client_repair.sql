
create or replace function public.psp_team_repair_my_clients_v275(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_member_id text;
  v_ad_repaired integer:=0;
  v_rr_repaired integer:=0;
  v_ad_count bigint:=0;
  v_rr_count bigint:=0;
  v_owner_count bigint:=0;
begin
  v_member_id:=public.psp_team_member_id_from_session_v245(p_session_token);
  if v_member_id is null then
    raise exception 'Team session is invalid or expired.';
  end if;

  -- V343: latest assignment (or explicit Admin override) is canonical.
  with latest_assignment as (
    select distinct on (a.user_id)
      a.user_id,a.team_member_id,a.client_name,a.client_email,a.client_whatsapp,
      a.assigned_at,a.created_at,a.id
    from public.psp_lead_assignments a
    where a.user_id is not null
    order by a.user_id,a.assigned_at desc,a.created_at desc,a.id desc
  ),
  candidates as (
    select
      public.psp_client_key_v273(
        a.user_id,
        coalesce(nullif(a.client_email,''),p.email),
        coalesce(nullif(a.client_whatsapp,''),p.whatsapp,p.phone),
        p.client_id
      ) as client_key,
      a.user_id,
      coalesce(p.client_id,'')::text as client_id,
      coalesce(nullif(a.client_name,''),nullif(p.full_name,''),split_part(coalesce(a.client_email,p.email,''),'@',1),'Client')::text as full_name,
      lower(trim(coalesce(nullif(a.client_email,''),p.email,'')))::text as email,
      regexp_replace(coalesce(nullif(a.client_whatsapp,''),p.whatsapp,p.phone,''),'[^0-9+]','','g')::text as whatsapp,
      coalesce(ov.team_member_id,a.team_member_id)::text as desired_team_member_id,
      coalesce(a.assigned_at,a.created_at,clock_timestamp()) as assigned_at,
      case when ov.team_member_id is not null then 'Admin Override' else 'Round Robin' end::text as source
    from latest_assignment a
    left join public.profiles p on p.id=a.user_id
    left join public.psp_client_manager_override_v281 ov on ov.user_id=a.user_id
  )
  insert into public.psp_client_owner_v273(
    client_key,user_id,client_id,full_name,email,whatsapp,
    team_member_id,source,assigned_at,updated_at
  )
  select
    c.client_key,c.user_id,c.client_id,c.full_name,c.email,c.whatsapp,
    c.desired_team_member_id,c.source,c.assigned_at,clock_timestamp()
  from candidates c
  where c.desired_team_member_id=v_member_id
    and c.client_key is not null
  on conflict(client_key) do update set
    user_id=excluded.user_id,
    client_id=coalesce(nullif(excluded.client_id,''),public.psp_client_owner_v273.client_id),
    full_name=coalesce(nullif(excluded.full_name,''),public.psp_client_owner_v273.full_name),
    email=coalesce(nullif(excluded.email,''),public.psp_client_owner_v273.email),
    whatsapp=coalesce(nullif(excluded.whatsapp,''),public.psp_client_owner_v273.whatsapp),
    team_member_id=excluded.team_member_id,
    source=excluded.source,
    assigned_at=excluded.assigned_at,
    updated_at=clock_timestamp();
  get diagnostics v_rr_repaired=row_count;

  -- Ad source is fallback only when no lead assignment exists. An explicit
  -- Admin override can still direct such a client to the selected manager.
  with latest_ad as (
    select distinct on (s.user_id)
      s.*
    from public.psp_ad_submissions_v259 s
    where s.user_id is not null
    order by s.user_id,s.created_at desc,s.id desc
  ),
  candidates as (
    select
      public.psp_client_key_v273(s.user_id,s.email,s.whatsapp,s.client_id) as client_key,
      s.user_id,
      coalesce(s.client_id,'')::text as client_id,
      coalesce(nullif(s.full_name,''),'Client')::text as full_name,
      lower(trim(coalesce(s.email,'')))::text as email,
      regexp_replace(coalesce(s.whatsapp,''),'[^0-9+]','','g')::text as whatsapp,
      coalesce(ov.team_member_id,s.team_member_id)::text as desired_team_member_id,
      coalesce(s.created_at,clock_timestamp()) as assigned_at,
      case when ov.team_member_id is not null then 'Admin Override' else 'Ad Link' end::text as source
    from latest_ad s
    left join public.psp_client_manager_override_v281 ov on ov.user_id=s.user_id
    where not exists (
      select 1 from public.psp_lead_assignments a where a.user_id=s.user_id
    )
  )
  insert into public.psp_client_owner_v273(
    client_key,user_id,client_id,full_name,email,whatsapp,
    team_member_id,source,assigned_at,updated_at
  )
  select
    c.client_key,c.user_id,c.client_id,c.full_name,c.email,c.whatsapp,
    c.desired_team_member_id,c.source,c.assigned_at,clock_timestamp()
  from candidates c
  where c.desired_team_member_id=v_member_id
    and c.client_key is not null
  on conflict(client_key) do update set
    user_id=excluded.user_id,
    client_id=coalesce(nullif(excluded.client_id,''),public.psp_client_owner_v273.client_id),
    full_name=coalesce(nullif(excluded.full_name,''),public.psp_client_owner_v273.full_name),
    email=coalesce(nullif(excluded.email,''),public.psp_client_owner_v273.email),
    whatsapp=coalesce(nullif(excluded.whatsapp,''),public.psp_client_owner_v273.whatsapp),
    team_member_id=excluded.team_member_id,
    source=excluded.source,
    assigned_at=excluded.assigned_at,
    updated_at=clock_timestamp();
  get diagnostics v_ad_repaired=row_count;

  -- Counts represent canonical current ownership, not historical stale rows.
  with latest_assignment as (
    select distinct on (a.user_id) a.user_id,a.team_member_id
    from public.psp_lead_assignments a
    where a.user_id is not null
    order by a.user_id,a.assigned_at desc,a.created_at desc,a.id desc
  )
  select count(*) into v_rr_count
  from latest_assignment a
  left join public.psp_client_manager_override_v281 ov on ov.user_id=a.user_id
  where coalesce(ov.team_member_id,a.team_member_id)=v_member_id;

  select count(*) into v_ad_count
  from (
    select distinct s.user_id
    from public.psp_ad_submissions_v259 s
    left join public.psp_client_manager_override_v281 ov on ov.user_id=s.user_id
    where s.user_id is not null
      and coalesce(ov.team_member_id,s.team_member_id)=v_member_id
      and not exists (
        select 1 from public.psp_lead_assignments a where a.user_id=s.user_id
      )
  ) x;

  select count(*) into v_owner_count
  from public.psp_client_owner_v273 o
  where o.team_member_id=v_member_id;

  return jsonb_build_object(
    'ok',true,
    'team_member_id',v_member_id,
    'ad_repaired',v_ad_repaired,
    'round_robin_repaired',v_rr_repaired,
    'ad_source_count',v_ad_count,
    'assignment_source_count',v_rr_count,
    'owner_count',v_owner_count,
    'total_count',v_owner_count
  );
end;
$function$;
