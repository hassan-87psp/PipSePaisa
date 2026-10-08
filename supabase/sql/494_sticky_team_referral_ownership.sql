-- PipSePaisa V494 — sticky team referral ownership.
-- Original team-specific acquisition remains canonical unless Admin/Manual transfer exists.
-- Production historical data repair completed 2026-10-08.

CREATE OR REPLACE FUNCTION public.psp_capture_team_attribution_v206()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_owner text;
  v_link jsonb;
begin
  if new.user_id is null or new.link_id is null then return new; end if;

  v_owner := public.psp_team_owner_for_link_v206(new.link_id::text);
  if v_owner is null then return new; end if;

  select to_jsonb(tl) into v_link
  from public.tracked_links tl
  where tl.id::text = new.link_id::text
  limit 1;

  insert into public.team_client_attribution_v206(
    user_id,team_member_id,link_id,source,campaign,reference_code,attributed_at,updated_at
  ) values (
    new.user_id,v_owner,new.link_id::text,
    nullif(v_link->>'source',''),nullif(v_link->>'campaign',''),
    coalesce(nullif(v_link->>'slug',''),nullif(v_link->>'reference_code','')),
    coalesce(new.created_at,now()),now()
  )
  on conflict(user_id) do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_link_team_for_user_v281(p_user_id uuid)
RETURNS TABLE(team_member_id text, team_member_name text, whatsapp_number text, link_id text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_member_id text;
  v_link_id text;
  v_name text;
  v_wa text;
begin
  if p_user_id is null then return; end if;

  if to_regclass('public.team_client_attribution_v206') is not null
     and to_regclass('public.tracked_links') is not null then
    begin
      execute $q$
        select tl.assigned_team_member_id::text,tl.id::text
        from public.team_client_attribution_v206 a
        join public.tracked_links tl on tl.id::text=a.link_id::text
        where a.user_id=$1
          and nullif(trim(coalesce(tl.assigned_team_member_id::text,'')),'') is not null
          and coalesce(tl.is_active,true)=true
        order by a.attributed_at asc nulls last,a.created_at asc nulls last
        limit 1
      $q$ into v_member_id,v_link_id using p_user_id;
    exception when others then
      v_member_id:=null;v_link_id:=null;
    end;
  end if;

  if v_member_id is null
     and to_regclass('public.tracked_link_events') is not null
     and to_regclass('public.tracked_links') is not null then
    begin
      execute $q$
        select tl.assigned_team_member_id::text,tl.id::text
        from public.tracked_link_events e
        join public.tracked_links tl on tl.id::text=e.link_id::text
        where e.user_id=$1
          and e.event_type in ('signup','enrollment')
          and nullif(trim(coalesce(tl.assigned_team_member_id::text,'')),'') is not null
          and coalesce(tl.is_active,true)=true
        order by e.created_at asc nulls last,e.id asc
        limit 1
      $q$ into v_member_id,v_link_id using p_user_id;
    exception when others then
      v_member_id:=null;v_link_id:=null;
    end;
  end if;

  if nullif(trim(coalesce(v_member_id,'')),'') is null then return; end if;

  select
    coalesce(nullif(trim(t.display_name),''),nullif(trim(t.username),''),'PipSePaisa Team'),
    regexp_replace(coalesce(t.whatsapp_number,''),'[^0-9]','','g')
  into v_name,v_wa
  from public.team_members t
  where t.id::text=v_member_id
    and coalesce(t.is_active,true)=true
  limit 1;

  if v_name is null or length(coalesce(v_wa,''))<8 then return; end if;
  return query select v_member_id,v_name,v_wa,v_link_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_assign_enrollment_lead_v245(p_enrollment_id uuid)
RETURNS TABLE(assignment_id uuid, team_member_id text, team_member_name text, whatsapp_number text, enrollment_id uuid, client_name text, client_email text, client_whatsapp text, course_key text, course_name text, assigned_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_enrollment public.course_enrollments%rowtype;
  v_member_id text;
  v_member_name text;
  v_member_whatsapp text;
  v_assignment public.psp_lead_assignments%rowtype;
  v_override_id text;
  v_link record;
  v_event record;
  v_service boolean:=coalesce(current_setting('request.jwt.claim.role',true),'')='service_role';
  v_specific_owner boolean:=false;
  v_had_assignment boolean:=false;
  v_new_round_robin boolean:=false;
begin
  if auth.uid() is null and not v_service then raise exception 'Authentication required.'; end if;

  select e.* into v_enrollment
  from public.course_enrollments e
  where e.id=p_enrollment_id
  for update;

  if not found then raise exception 'Enrollment not found.'; end if;

  if not v_service
     and v_enrollment.user_id is distinct from auth.uid()
     and not public.psp_is_admin() then
    raise exception 'You can only assign your own enrollment.';
  end if;

  select o.team_member_id into v_override_id
  from public.psp_client_manager_override_v281 o
  where o.user_id=v_enrollment.user_id
  limit 1;

  if nullif(trim(coalesce(v_override_id,'')),'') is not null then
    v_member_id:=v_override_id;
    v_specific_owner:=true;
  else
    v_override_id:=public.psp_transfer_owner_v478(v_enrollment.user_id);
    if nullif(trim(coalesce(v_override_id,'')),'') is not null then
      v_member_id:=v_override_id;
      v_specific_owner:=true;
    else
      if not exists(
        select 1 from public.team_client_attribution_v206 a
        where a.user_id=v_enrollment.user_id
      ) then
        select
          tl.assigned_team_member_id::text,tl.id::text,tl.source,tl.campaign,tl.slug,e.created_at
        into v_event
        from public.tracked_link_events e
        join public.tracked_links tl on tl.id=e.link_id
        where nullif(e.metadata->>'enrollment_id','')=v_enrollment.id::text
          and e.event_type='enrollment'
          and nullif(trim(coalesce(tl.assigned_team_member_id::text,'')),'') is not null
          and coalesce(tl.is_active,true)=true
        order by e.created_at asc,e.id asc
        limit 1;

        if found then
          insert into public.team_client_attribution_v206(
            user_id,team_member_id,link_id,source,campaign,reference_code,attributed_at,updated_at
          ) values (
            v_enrollment.user_id,v_event.team_member_id,v_event.link_id,
            v_event.source,v_event.campaign,v_event.slug,v_event.created_at,clock_timestamp()
          )
          on conflict(user_id) do nothing;
        end if;
      end if;

      select * into v_link
      from public.psp_link_team_for_user_v281(v_enrollment.user_id)
      limit 1;

      if found then
        v_member_id:=v_link.team_member_id;
        v_member_name:=v_link.team_member_name;
        v_member_whatsapp:=v_link.whatsapp_number;
        v_specific_owner:=true;
      elsif public.psp_specific_link_owner_v477(v_enrollment.user_id) is not null then
        return;
      end if;
    end if;
  end if;

  select a.* into v_assignment
  from public.psp_lead_assignments a
  where a.enrollment_id=p_enrollment_id
  limit 1;
  v_had_assignment:=found;

  if v_member_id is null and v_had_assignment then v_member_id:=v_assignment.team_member_id; end if;

  if v_member_id is null then
    select
      t.id::text,
      coalesce(nullif(trim(t.display_name),''),nullif(trim(t.username),''),'PipSePaisa Team'),
      regexp_replace(coalesce(t.whatsapp_number,''),'[^0-9]','','g')
    into v_member_id,v_member_name,v_member_whatsapp
    from public.team_members t
    where coalesce(t.is_active,true)=true
      and coalesce(t.lead_distribution_enabled,true)=true
      and length(regexp_replace(coalesce(t.whatsapp_number,''),'[^0-9]','','g'))>=8
    order by t.lead_last_assigned_at asc nulls first,t.id::text asc
    for update of t skip locked
    limit 1;

    if v_member_id is null then return; end if;
    v_new_round_robin:=true;
  end if;

  if v_member_name is null or v_member_whatsapp is null then
    select
      coalesce(nullif(trim(t.display_name),''),nullif(trim(t.username),''),'PipSePaisa Team'),
      regexp_replace(coalesce(t.whatsapp_number,''),'[^0-9]','','g')
    into v_member_name,v_member_whatsapp
    from public.team_members t
    where t.id::text=v_member_id
      and (not v_specific_owner or coalesce(t.is_active,true)=true)
    limit 1;
  end if;

  if v_member_name is null or length(coalesce(v_member_whatsapp,''))<8 then return; end if;

  insert into public.psp_lead_assignments(
    enrollment_id,user_id,team_member_id,team_member_name,team_member_whatsapp,
    course_key,course_name,client_name,client_email,client_whatsapp,assigned_at
  ) values(
    v_enrollment.id,v_enrollment.user_id,v_member_id,v_member_name,v_member_whatsapp,
    v_enrollment.course_key,v_enrollment.course_name,
    coalesce(nullif(trim(v_enrollment.full_name),''),split_part(coalesce(v_enrollment.email,''),'@',1),'PipSePaisa Student'),
    coalesce(v_enrollment.email,''),coalesce(v_enrollment.whatsapp,''),clock_timestamp()
  )
  on conflict on constraint psp_lead_assignments_enrollment_id_key do update set
    user_id=excluded.user_id,
    team_member_id=excluded.team_member_id,
    team_member_name=excluded.team_member_name,
    team_member_whatsapp=excluded.team_member_whatsapp,
    course_key=excluded.course_key,
    course_name=excluded.course_name,
    client_name=excluded.client_name,
    client_email=excluded.client_email,
    client_whatsapp=excluded.client_whatsapp
  returning * into v_assignment;

  update public.psp_lead_assignments a
  set team_member_id=v_member_id,
      team_member_name=v_member_name,
      team_member_whatsapp=v_member_whatsapp
  where a.user_id=v_enrollment.user_id
    and a.team_member_id is distinct from v_member_id;

  insert into public.psp_client_owner_v273(
    client_key,user_id,client_id,full_name,email,whatsapp,
    team_member_id,source,assigned_at,updated_at
  )
  values(
    public.psp_client_key_v273(
      v_enrollment.user_id,v_enrollment.email,v_enrollment.whatsapp,
      (select p.client_id from public.profiles p where p.id=v_enrollment.user_id limit 1)
    ),
    v_enrollment.user_id,
    coalesce((select p.client_id from public.profiles p where p.id=v_enrollment.user_id limit 1),''),
    coalesce(nullif(trim(v_enrollment.full_name),''),split_part(coalesce(v_enrollment.email,''),'@',1),'Client'),
    lower(trim(coalesce(v_enrollment.email,''))),
    regexp_replace(coalesce(v_enrollment.whatsapp,''),'[^0-9+]','','g'),
    v_member_id,
    case when v_specific_owner then 'Specific Assignment' else 'Round Robin' end,
    coalesce(v_assignment.assigned_at,clock_timestamp()),
    clock_timestamp()
  )
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

  if v_new_round_robin then
    update public.team_members
    set lead_last_assigned_at=v_assignment.assigned_at,
        lead_assignment_count=coalesce(lead_assignment_count,0)+1
    where id::text=v_member_id;
  end if;

  return query select
    v_assignment.id,v_assignment.team_member_id,v_assignment.team_member_name,
    v_assignment.team_member_whatsapp,v_assignment.enrollment_id,v_assignment.client_name,
    v_assignment.client_email,v_assignment.client_whatsapp,v_assignment.course_key,
    v_assignment.course_name,v_assignment.assigned_at;
end;
$function$;
