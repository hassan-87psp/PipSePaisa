-- PipSePaisa V396 — Admin Team Monitor
-- Gives Admin a read-only mirror of the Team Panel client/work state and performance ranges.

create or replace function public.psp_admin_team_performance_range_v396(
  p_team_member_id text,
  p_start_date date,
  p_end_date date
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_team text:=nullif(trim(coalesce(p_team_member_id,'')),'');
  sd date:=coalesce(p_start_date,(now() at time zone 'Asia/Kuala_Lumpur')::date);
  ed date:=coalesce(p_end_date,coalesce(p_start_date,(now() at time zone 'Asia/Kuala_Lumpur')::date));
  sts timestamptz;
  ets timestamptz;
  base jsonb;
  b1 integer:=0;b2 integer:=0;b3 integer:=0;
  f1 integer:=0;f2 integer:=0;fund integer:=0;
  adv integer:=0;advfund integer:=0;
begin
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;
  if v_team is null then raise exception 'Team member is required.'; end if;
  if ed<sd then raise exception 'End date cannot be before start date.'; end if;
  if ed-sd>370 then raise exception 'Custom range cannot exceed 371 days.'; end if;

  base:=public.psp_team_performance_range_core_v207(v_team,sd,ed)
        || public.psp_team_client_cohort_stats_v209(v_team,sd,ed+1);
  sts:=sd::timestamp at time zone 'Asia/Kuala_Lumpur';
  ets:=(ed+1)::timestamp at time zone 'Asia/Kuala_Lumpur';

  with ok as (
    select
      ce.user_id,
      a.attributed_at,
      lower(coalesce(ce.psp_batch_key,'')) as batch_key,
      case
        when lower(coalesce(ce.course_segment,'')) in ('advance_fundamental','advanced_fundamental')
          or lower(coalesce(ce.course_key,'')) in ('advance-fundamental','advanced-fundamental','advance_fundamental','advanced_fundamental')
          or lower(coalesce(ce.course_name,'')) like '%advance%fundamental%'
          or lower(coalesce(ce.course_name,'')) like '%advanced%fundamental%'
          then 'advance_fundamental'
        when lower(coalesce(ce.course_segment,''))='fundamental'
          or lower(coalesce(ce.course_key,''))='fundamental'
          or lower(coalesce(ce.course_name,'')) like '%fundamental%'
          then 'fundamental'
        when lower(coalesce(ce.course_segment,''))='advanced'
          or lower(coalesce(ce.course_key,''))='advanced'
          or lower(coalesce(ce.course_name,'')) like '%advanced%'
          then 'advanced'
        when lower(coalesce(ce.course_segment,'')) in ('batch1','batch2','batch3')
          or lower(coalesce(ce.course_key,'')) like 'basic%'
          or lower(coalesce(ce.course_name,'')) like '%basic forex course%'
          or lower(coalesce(ce.course_name,'')) like '%free course%'
          then 'free'
        else 'other'
      end as family
    from public.course_enrollments ce
    left join public.team_client_attribution_v206 a on a.user_id=ce.user_id
    where public.psp_team_member_at_event_v371(ce.user_id,public.psp_course_paid_event_at_v371(ce.id))=v_team
      and (
        lower(coalesce(ce.enrollment_status,''))='enrolled'
        or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
        or lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')
      )
      and public.psp_course_paid_event_at_v371(ce.id)>=sts
      and public.psp_course_paid_event_at_v371(ce.id)<ets
  )
  select
    count(distinct user_id) filter(where family='free' and (batch_key='basic_b1' or (batch_key not in ('basic_b1','basic_b2','basic_b3') and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date<date '2026-09-01')))::integer,
    count(distinct user_id) filter(where family='free' and (batch_key='basic_b2' or (batch_key not in ('basic_b1','basic_b2','basic_b3') and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date>=date '2026-09-01' and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date<date '2026-09-16')))::integer,
    count(distinct user_id) filter(where family='free' and (batch_key='basic_b3' or (batch_key not in ('basic_b1','basic_b2','basic_b3') and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date>=date '2026-09-16')))::integer,
    count(distinct user_id) filter(where family='fundamental')::integer,
    count(distinct user_id) filter(where family='fundamental' and (batch_key='fundamental_b1' or (batch_key not in ('fundamental_b1','fundamental_b2') and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date<date '2026-09-16')))::integer,
    count(distinct user_id) filter(where family='fundamental' and (batch_key='fundamental_b2' or (batch_key not in ('fundamental_b1','fundamental_b2') and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date>=date '2026-09-16')))::integer,
    count(distinct user_id) filter(where family='advanced')::integer,
    count(distinct user_id) filter(where family='advance_fundamental')::integer
  into b1,b2,b3,fund,f1,f2,adv,advfund
  from ok;

  return coalesce(base,'{}'::jsonb) || jsonb_build_object(
    'batch1_users',coalesce(b1,0),
    'batch2_users',coalesce(b2,0),
    'batch3_users',coalesce(b3,0),
    'fundamental_users',coalesce(fund,0),
    'fundamental_b1_users',coalesce(f1,0),
    'fundamental_b2_users',coalesce(f2,0),
    'advance_users',coalesce(adv,0),
    'advance_fundamental_users',coalesce(advfund,0),
    'course_total',coalesce(b1,0)+coalesce(b2,0)+coalesce(b3,0)+coalesce(fund,0)+coalesce(adv,0)+coalesce(advfund,0)
  );
end;
$function$;

revoke all on function public.psp_admin_team_performance_range_v396(text,date,date) from public,anon;
grant execute on function public.psp_admin_team_performance_range_v396(text,date,date) to authenticated;

create or replace function public.psp_admin_team_monitor_clients_v396(
  p_team_member_id text default null,
  p_limit integer default 5000
) returns table(
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
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_limit integer:=greatest(1,least(coalesce(p_limit,5000),5000));
  v_team text:=nullif(trim(coalesce(p_team_member_id,'')),'');
begin
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;

  return query
  with owned as (
    select
      o.*,
      p.created_at as profile_created_at,
      p.full_name as profile_full_name,
      p.email as profile_email,
      p.whatsapp as profile_whatsapp,
      p.phone as profile_phone,
      p.client_id as profile_client_id,
      lower(regexp_replace(trim(coalesce(nullif(o.full_name,''),nullif(p.full_name,''),'')),'\s+',' ','g')) as name_norm,
      regexp_replace(coalesce(nullif(o.whatsapp,''),nullif(p.whatsapp,''),p.phone,''),'[^0-9]','','g') as phone_norm
    from public.psp_client_owner_v273 o
    left join public.profiles p on p.id=o.user_id
    where v_team is null or o.team_member_id=v_team
  ),
  keyed as (
    select x.*,
      case
        when length(x.phone_norm)>=7 and nullif(x.name_norm,'') is not null
          then coalesce(x.team_member_id,'')||':person:'||x.phone_norm||':'||x.name_norm
        else coalesce(x.team_member_id,'')||':user:'||x.user_id::text
      end as person_key
    from owned x
  ),
  groups as (
    select k.person_key,min(coalesce(k.assigned_at,k.profile_created_at,k.updated_at)) as first_seen_at,count(*)::integer as account_count
    from keyed k group by k.person_key
  ),
  rep as (
    select distinct on(k.person_key) k.*
    from keyed k
    left join public.psp_client_work_v273 w on w.client_key=k.client_key
    order by k.person_key,case when coalesce(w.status,'new')<>'new' then 0 else 1 end,coalesce(w.updated_at,'epoch'::timestamptz) desc,coalesce(k.assigned_at,k.profile_created_at,k.updated_at) asc,k.updated_at desc
  )
  select
    r.team_member_id::text,
    coalesce(nullif(tm.display_name,''),nullif(tm.username,''),'Team Member')::text,
    r.user_id,
    r.client_key::text,
    coalesce(nullif(r.client_id,''),nullif(r.profile_client_id,''),'PSP-'||upper(substr(replace(r.user_id::text,'-',''),1,8)))::text,
    coalesce(nullif(r.full_name,''),nullif(r.profile_full_name,''),split_part(coalesce(r.email,r.profile_email,''),'@',1),'Client')::text,
    coalesce(nullif(r.email,''),r.profile_email,'')::text,
    coalesce(nullif(r.whatsapp,''),nullif(r.profile_whatsapp,''),r.profile_phone,'')::text,
    g.first_seen_at::timestamptz,
    coalesce(src.source,'Assigned')::text,
    coalesce(nullif(attr.campaign,''),'Current Assignment')::text,
    coalesce(nullif(attr.reference_code,''),'OWNER')::text,
    coalesce(crs.courses,'No course yet')::text,
    case when coalesce(vip.is_vip,false) then 'VIP' else 'Not VIP' end::text,
    coalesce(br.broker,'—')::text,
    coalesce(br.broker_status,'—')::text,
    coalesce(br.account_mode,'—')::text,
    coalesce(wrk.status,'new')::text,
    wrk.follow_up_at,
    wrk.note,
    wrk.updated_at,
    (coalesce(crs.has_active_course,false) or coalesce(vip.is_vip,false) or coalesce(br.is_approved,false))::boolean,
    (coalesce(wrk.status,'new')='follow_up' and wrk.follow_up_at is not null and wrk.follow_up_at<=clock_timestamp())::boolean,
    g.account_count
  from rep r
  join groups g on g.person_key=r.person_key
  left join public.team_members tm on tm.id::text=r.team_member_id
  left join lateral (
    select case
      when lower(coalesce(k.source,'')) ~ '(ad|round[ _-]*robin|auto)' then 'Ad / Auto'
      when lower(coalesce(k.source,'')) ~ '(override|specific|manager|transfer|assignment[ _-]*sync)' then 'Manager Transfer'
      else coalesce(nullif(k.source,''),'Assigned') end::text as source
    from keyed k where k.person_key=r.person_key
    order by case when lower(coalesce(k.source,'')) ~ '(ad|round[ _-]*robin|auto)' then 3 when lower(coalesce(k.source,'')) ~ '(override|specific|manager|transfer|assignment[ _-]*sync)' then 2 else 1 end desc,k.updated_at desc limit 1
  ) src on true
  left join lateral (
    select a.campaign::text,a.reference_code::text
    from public.team_client_attribution_v206 a join keyed k on k.user_id=a.user_id and k.person_key=r.person_key
    order by a.attributed_at desc,a.updated_at desc nulls last limit 1
  ) attr on true
  left join lateral (
    select string_agg(x.label,', ' order by x.label)::text as courses,bool_or(x.is_active) as has_active_course
    from (
      select distinct
        (coalesce(nullif(ce.course_name,''),nullif(ce.course_key,''),'Course')||case when nullif(trim(coalesce(ce.psp_batch_key,'')),'') is not null then ' ['||lower(trim(ce.psp_batch_key))||']' else '' end)::text as label,
        (lower(coalesce(ce.enrollment_status,''))='enrolled' or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted') or lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')) as is_active
      from public.course_enrollments ce join keyed k on k.user_id=ce.user_id and k.person_key=r.person_key
      where lower(coalesce(ce.enrollment_status,'')) not in ('cancelled','canceled','rejected','revoked') and lower(coalesce(ce.payment_status,'')) not in ('rejected','revoked')
    ) x
  ) crs on true
  left join lateral (
    select true as is_vip
    from public.payment_requests pr join keyed k on k.user_id=pr.user_id and k.person_key=r.person_key
    where lower(coalesce(pr.status,'')) in ('approved','paid','success','successful','completed','accepted','confirmed','verified')
      and (lower(coalesce(to_jsonb(pr)->>'plan_name','')) like '%vip%' or lower(coalesce(pr.request_type,'')) like '%vip%' or coalesce(pr.amount,0)=50)
    order by coalesce(pr.reviewed_at,pr.updated_at,pr.created_at) desc limit 1
  ) vip on true
  left join lateral (
    select upper(coalesce(nullif(av.broker,''),'—'))::text as broker,
      case when lower(coalesce(av.submission_status,'')) in ('approved','accepted','verified','completed') then 'Approved' else initcap(coalesce(nullif(av.submission_status,''),'Pending')) end::text as broker_status,
      case when coalesce(av.existing_account,false) then 'IB Shift' else 'New Account' end::text as account_mode,
      (lower(coalesce(av.submission_status,'')) in ('approved','accepted','verified','completed')) as is_approved
    from public.account_verifications av join keyed k on k.user_id=av.user_id and k.person_key=r.person_key
    order by coalesce(av.reviewed_at,av.updated_at,av.submitted_at,av.created_at) desc limit 1
  ) br on true
  left join lateral (
    select w.status,w.follow_up_at,w.note,w.updated_at
    from public.psp_client_work_v273 w join keyed k on k.client_key=w.client_key and k.person_key=r.person_key
    order by w.updated_at desc limit 1
  ) wrk on true
  order by g.first_seen_at desc nulls last,r.client_key
  limit v_limit;
end;
$function$;

revoke all on function public.psp_admin_team_monitor_clients_v396(text,integer) from public,anon;
grant execute on function public.psp_admin_team_monitor_clients_v396(text,integer) to authenticated;
