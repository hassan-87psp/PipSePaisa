
create or replace function public.psp_team_clients_v206(p_session_token text, p_limit integer default 1000)
returns table(
  client_id text, full_name text, whatsapp text, registration_at timestamptz,
  source text, campaign text, reference_code text, course_enrollment text,
  vip_status text, broker text, broker_status text, account_mode text, conversion_status text
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_team text;
  v_limit integer:=greatest(1,least(coalesce(p_limit,1000),2000));
begin
  v_team:=public.psp_team_member_from_session_v206(p_session_token);
  if v_team is null then raise exception 'Invalid or expired Team Panel session.'; end if;

  return query
  select
    coalesce(nullif(to_jsonb(p)->>'client_id',''),'PSP-'||upper(substr(replace(a.user_id::text,'-',''),1,8)))::text,
    coalesce(nullif(to_jsonb(p)->>'full_name',''),nullif(to_jsonb(p)->>'name',''),'User')::text,
    coalesce(nullif(to_jsonb(p)->>'whatsapp',''),nullif(to_jsonb(p)->>'phone',''))::text,
    a.attributed_at,
    coalesce(a.source,'Other')::text,
    coalesce(a.campaign,'No campaign')::text,
    coalesce(a.reference_code,'—')::text,
    coalesce(c.courses,'None')::text,
    coalesce(v.vip_status,'Not VIP')::text,
    coalesce(b.broker,'—')::text,
    coalesce(b.broker_status,'—')::text,
    coalesce(b.account_mode,'—')::text,
    case when coalesce(v.vip_status,'')='VIP'
           or coalesce(c.courses,'')<>''
           or coalesce(b.broker_status,'') in ('Approved','Verified')
         then 'Converted' else 'Registered' end::text
  from public.team_client_attribution_v206 a
  left join public.profiles p on p.id=a.user_id
  left join lateral (
    select string_agg(x.label, ', ' order by x.label) courses
    from (
      select distinct
        (
          coalesce(nullif(ce.course_name,''),nullif(ce.course_key,''),'Course')
          || case
               when nullif(trim(coalesce(ce.psp_batch_key,'')),'') is not null
               then ' ['||lower(trim(ce.psp_batch_key))||']'
               else ''
             end
        )::text as label
      from public.course_enrollments ce
      where ce.user_id=a.user_id
        and (
          lower(coalesce(ce.enrollment_status,''))='enrolled'
          or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
        )
    ) x
  ) c on true
  left join lateral (
    select 'VIP'::text vip_status
    from public.payment_requests pr
    where pr.user_id=a.user_id
      and lower(coalesce(to_jsonb(pr)->>'status','')) in ('approved','paid','success','successful','completed','accepted','confirmed','verified')
      and (
        lower(coalesce(to_jsonb(pr)->>'plan_name','')) like '%vip%'
        or coalesce(nullif(to_jsonb(pr)->>'amount','')::numeric,0)=50
      )
    limit 1
  ) v on true
  left join lateral (
    select
      upper(coalesce(nullif(to_jsonb(av)->>'broker',''),'—'))::text broker,
      case when lower(coalesce(to_jsonb(av)->>'status',to_jsonb(av)->>'submission_status',''))
                in ('approved','accepted','verified','completed')
           then 'Approved'
           else initcap(coalesce(to_jsonb(av)->>'status',to_jsonb(av)->>'submission_status','Pending'))
      end::text broker_status,
      case when lower(coalesce(to_jsonb(av)->>'existing_account','false')) in ('true','t','1','yes')
           then 'IB Shift' else 'New Account' end::text account_mode
    from public.account_verifications av
    where av.user_id=a.user_id
    order by coalesce(
      nullif(to_jsonb(av)->>'updated_at','')::timestamptz,
      nullif(to_jsonb(av)->>'submitted_at','')::timestamptz,
      av.created_at
    ) desc
    limit 1
  ) b on true
  where a.team_member_id=v_team
  order by a.attributed_at desc
  limit v_limit;
end;
$function$;

create or replace function public.psp_team_owned_clients_v273(p_session_token text, p_limit integer default 1500)
returns table(
  user_id uuid, client_key text, client_id text, full_name text, email text, whatsapp text,
  registration_at timestamptz, source text, campaign text, reference_code text,
  course_enrollment text, vip_status text, broker text, broker_status text, account_mode text,
  conversion_status text, follow_up_at timestamptz, work_note text
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_member_id text;
begin
  v_member_id:=public.psp_team_member_id_from_session_v245(p_session_token);
  if v_member_id is null then raise exception 'Team session is invalid or expired.'; end if;

  return query
  select
    o.user_id,o.client_key,
    coalesce(nullif(o.client_id,''),to_jsonb(p)->>'client_id','')::text,
    coalesce(nullif(o.full_name,''),to_jsonb(p)->>'full_name',split_part(coalesce(o.email,to_jsonb(p)->>'email',''),'@',1),'Client')::text,
    coalesce(nullif(o.email,''),to_jsonb(p)->>'email','')::text,
    coalesce(nullif(o.whatsapp,''),to_jsonb(p)->>'whatsapp',to_jsonb(p)->>'phone','')::text,
    o.assigned_at,
    'Manager Assignment'::text,
    'Admin'::text,
    'MANAGER'::text,
    coalesce(c.courses,'Client')::text,
    'Not VIP'::text,
    null::text,null::text,null::text,
    coalesce(w.status,'new')::text,w.follow_up_at,w.note
  from public.psp_client_owner_v273 o
  left join public.profiles p on p.id=o.user_id
  left join public.psp_client_work_v273 w on w.client_key=o.client_key
  left join lateral (
    select string_agg(x.label, ', ' order by x.label) courses
    from (
      select distinct
        (
          coalesce(nullif(e.course_name,''),nullif(e.course_key,''),'Course')
          || case
               when nullif(trim(coalesce(e.psp_batch_key,'')),'') is not null
               then ' ['||lower(trim(e.psp_batch_key))||']'
               else ''
             end
        )::text as label
      from public.course_enrollments e
      where e.user_id=o.user_id
    ) x
  ) c on true
  where o.team_member_id=v_member_id
  order by o.updated_at desc
  limit greatest(1,least(coalesce(p_limit,1500),3000));
end;
$function$;

create or replace function public.psp_team_assigned_leads_v245(p_session_token text, p_limit integer default 1000)
returns table(
  assignment_id uuid, user_id uuid, client_id text, full_name text, email text, whatsapp text,
  registration_at timestamptz, source text, campaign text, reference_code text,
  course_enrollment text, vip_status text, broker text, broker_status text, account_mode text,
  conversion_status text
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_member_id text;
  v_limit integer := greatest(1, least(coalesce(p_limit, 1000), 2000));
begin
  v_member_id := public.psp_team_member_id_from_session_v245(p_session_token);
  if v_member_id is null then raise exception 'Team session is invalid or expired.'; end if;

  return query
  with latest_owner as (
    select distinct on (a.user_id)
      a.id,a.user_id,a.team_member_id,a.team_member_name,a.team_member_whatsapp,
      a.course_key,a.course_name,a.course_batch_key,
      a.client_name,a.client_email,a.client_whatsapp,
      a.assigned_at,a.created_at
    from public.psp_lead_assignments a
    where a.user_id is not null
    order by a.user_id,a.assigned_at desc,a.created_at desc,a.id desc
  )
  select
    lo.id,
    lo.user_id,
    coalesce(p.client_id::text, ''),
    coalesce(
      nullif(lo.client_name, ''),
      nullif(p.full_name, ''),
      split_part(coalesce(lo.client_email, p.email, ''), '@', 1),
      'PipSePaisa Student'
    ),
    coalesce(nullif(lo.client_email, ''), p.email, ''),
    coalesce(nullif(lo.client_whatsapp, ''), p.whatsapp, p.phone, ''),
    lo.assigned_at,
    'Auto Lead'::text,
    'Assigned Owner'::text,
    ('AUTO-' || upper(substr(replace(lo.id::text, '-', ''), 1, 8)))::text,
    coalesce(
      c.courses,
      (
        coalesce(nullif(lo.course_name,''),nullif(lo.course_key,''),'Course')
        || case
             when nullif(trim(coalesce(lo.course_batch_key,'')),'') is not null
             then ' ['||lower(trim(lo.course_batch_key))||']'
             else ''
           end
      )
    )::text,
    'Not VIP'::text,
    null::text,
    null::text,
    null::text,
    'Registered'::text
  from latest_owner lo
  left join public.profiles p on p.id=lo.user_id
  left join lateral (
    select string_agg(x.label, ', ' order by x.label) courses
    from (
      select distinct
        (
          coalesce(nullif(e.course_name,''),nullif(e.course_key,''),'Course')
          || case
               when nullif(trim(coalesce(e.psp_batch_key,'')),'') is not null
               then ' ['||lower(trim(e.psp_batch_key))||']'
               else ''
             end
        )::text as label
      from public.course_enrollments e
      where e.user_id=lo.user_id
        and (
          lower(coalesce(e.enrollment_status,''))='enrolled'
          or lower(coalesce(e.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
        )
    ) x
  ) c on true
  where lo.team_member_id=v_member_id
  order by lo.assigned_at desc
  limit v_limit;
end;
$function$;
