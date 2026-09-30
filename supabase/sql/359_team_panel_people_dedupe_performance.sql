-- PipSePaisa V359 — deduplicated Team people, strict work ownership,
-- canonical search/export, and accurate performance batch breakdown.
-- Applied to production on 2026-09-30.

CREATE OR REPLACE FUNCTION public.psp_team_client_export_v359(p_session_token text, p_limit integer DEFAULT 5000)
 RETURNS TABLE(client_id text, full_name text, whatsapp text, assigned_manager text, registration_link text, course_batches text, assigned_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_member_id text;
  v_limit integer:=greatest(1,least(coalesce(p_limit,5000),5000));
begin
  v_member_id:=public.psp_team_member_id_from_session_v245(p_session_token);
  if v_member_id is null then raise exception 'Team session is invalid or expired.'; end if;

  return query
  select
    c.client_id,
    c.full_name,
    c.whatsapp,
    coalesce(nullif(tm.display_name,''),nullif(tm.username,''),'Team Member')::text,
    coalesce(
      case when nullif(attr.slug,'') is not null then
        'https://pipsepaisa.com'
        ||case when coalesce(attr.destination_path,'/') like '/'||'%' then coalesce(attr.destination_path,'/')
               else '/'||coalesce(attr.destination_path,'') end
        ||case when position('?' in coalesce(attr.destination_path,'/'))>0 then '&' else '?' end
        ||'ref='||attr.slug end,
      case when nullif(adsrc.source_path,'') is not null then
        'https://pipsepaisa.com'||case when adsrc.source_path like '/'||'%' then adsrc.source_path else '/'||adsrc.source_path end end,
      case when nullif(manager_link.slug,'') is not null then
        'https://pipsepaisa.com'
        ||case when coalesce(manager_link.destination_path,'/') like '/'||'%' then coalesce(manager_link.destination_path,'/')
               else '/'||coalesce(manager_link.destination_path,'') end
        ||case when position('?' in coalesce(manager_link.destination_path,'/'))>0 then '&' else '?' end
        ||'ref='||manager_link.slug else '' end
    )::text,
    c.course_enrollment,
    c.registration_at
  from public.psp_team_clients_v359(p_session_token,v_limit) c
  left join public.team_members tm on tm.id::text=v_member_id
  left join public.tracked_links manager_link on manager_link.id=tm.link_id
  left join lateral (
    select tl.slug,tl.destination_path
    from public.team_client_attribution_v206 ca
    join public.tracked_links tl on tl.id::text=ca.link_id
    where ca.user_id=c.user_id
    order by ca.attributed_at desc,ca.updated_at desc
    limit 1
  ) attr on true
  left join lateral (
    select s.source_path
    from public.psp_ad_submissions_v259 s
    where s.user_id=c.user_id and nullif(trim(coalesce(s.source_path,'')),'') is not null
    order by s.created_at desc
    limit 1
  ) adsrc on true
  order by c.registration_at desc nulls last,c.client_id
  limit v_limit;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_clients_v359(p_session_token text, p_limit integer DEFAULT 3000)
 RETURNS TABLE(user_id uuid, client_key text, client_id text, full_name text, email text, whatsapp text, registration_at timestamp with time zone, source text, campaign text, reference_code text, course_enrollment text, vip_status text, broker text, broker_status text, account_mode text, conversion_status text, follow_up_at timestamp with time zone, work_note text, work_status text, is_converted boolean, duplicate_accounts integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_member_id text;
  v_limit integer:=greatest(1,least(coalesce(p_limit,3000),5000));
begin
  v_member_id:=public.psp_team_member_id_from_session_v245(p_session_token);
  if v_member_id is null then raise exception 'Team session is invalid or expired.'; end if;

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
    where o.team_member_id=v_member_id
  ),
  keyed as (
    select x.*,
      case
        when length(x.phone_norm)>=7 and nullif(x.name_norm,'') is not null
          then 'person:'||x.phone_norm||':'||x.name_norm
        else 'user:'||x.user_id::text
      end as person_key
    from owned x
  ),
  groups as (
    select
      k.person_key,
      min(coalesce(k.assigned_at,k.profile_created_at,k.updated_at)) as first_seen_at,
      count(*)::integer as account_count
    from keyed k
    group by k.person_key
  ),
  rep as (
    select distinct on(k.person_key) k.*
    from keyed k
    left join public.psp_client_work_v273 w on w.client_key=k.client_key
    order by
      k.person_key,
      case when coalesce(w.status,'new')<>'new' then 0 else 1 end,
      coalesce(w.updated_at,'epoch'::timestamptz) desc,
      coalesce(k.assigned_at,k.profile_created_at,k.updated_at) asc,
      k.updated_at desc
  )
  select
    r.user_id,
    r.client_key,
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
    coalesce(wrk.status,'new')::text,
    (coalesce(crs.has_active_course,false) or coalesce(vip.is_vip,false) or coalesce(br.is_approved,false))::boolean,
    g.account_count
  from rep r
  join groups g on g.person_key=r.person_key

  left join lateral (
    select
      case
        when lower(coalesce(k.source,'')) ~ '(ad|round[ _-]*robin|auto)' then 'Ad / Auto'
        when lower(coalesce(k.source,'')) ~ '(override|specific|manager|transfer|assignment[ _-]*sync)' then 'Manager Transfer'
        else coalesce(nullif(k.source,''),'Assigned')
      end::text as source
    from keyed k
    where k.person_key=r.person_key
    order by
      case
        when lower(coalesce(k.source,'')) ~ '(ad|round[ _-]*robin|auto)' then 3
        when lower(coalesce(k.source,'')) ~ '(override|specific|manager|transfer|assignment[ _-]*sync)' then 2
        else 1
      end desc,
      k.updated_at desc
    limit 1
  ) src on true

  left join lateral (
    select a.campaign::text,a.reference_code::text
    from public.team_client_attribution_v206 a
    join keyed k on k.user_id=a.user_id and k.person_key=r.person_key
    order by a.attributed_at desc,a.updated_at desc nulls last
    limit 1
  ) attr on true

  left join lateral (
    select
      string_agg(x.label,', ' order by x.label)::text as courses,
      bool_or(x.is_active) as has_active_course
    from (
      select distinct
        (coalesce(nullif(ce.course_name,''),nullif(ce.course_key,''),'Course')
          ||case when nullif(trim(coalesce(ce.psp_batch_key,'')),'') is not null
                 then ' ['||lower(trim(ce.psp_batch_key))||']' else '' end)::text as label,
        (
          lower(coalesce(ce.enrollment_status,''))='enrolled'
          or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
          or lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')
        ) as is_active
      from public.course_enrollments ce
      join keyed k on k.user_id=ce.user_id and k.person_key=r.person_key
      where lower(coalesce(ce.enrollment_status,'')) not in ('cancelled','canceled','rejected','revoked')
        and lower(coalesce(ce.payment_status,'')) not in ('rejected','revoked')
    ) x
  ) crs on true

  left join lateral (
    select true as is_vip
    from public.payment_requests pr
    join keyed k on k.user_id=pr.user_id and k.person_key=r.person_key
    where lower(coalesce(pr.status,'')) in ('approved','paid','success','successful','completed','accepted','confirmed','verified')
      and (
        lower(coalesce(to_jsonb(pr)->>'plan_name','')) like '%vip%'
        or lower(coalesce(pr.request_type,'')) like '%vip%'
        or coalesce(pr.amount,0)=50
      )
    order by coalesce(pr.reviewed_at,pr.updated_at,pr.created_at) desc
    limit 1
  ) vip on true

  left join lateral (
    select
      upper(coalesce(nullif(av.broker,''),'—'))::text as broker,
      case when lower(coalesce(av.submission_status,'')) in ('approved','accepted','verified','completed')
           then 'Approved'
           else initcap(coalesce(nullif(av.submission_status,''),'Pending')) end::text as broker_status,
      case when coalesce(av.existing_account,false) then 'IB Shift' else 'New Account' end::text as account_mode,
      (lower(coalesce(av.submission_status,'')) in ('approved','accepted','verified','completed')) as is_approved
    from public.account_verifications av
    join keyed k on k.user_id=av.user_id and k.person_key=r.person_key
    order by coalesce(av.reviewed_at,av.updated_at,av.submitted_at,av.created_at) desc
    limit 1
  ) br on true

  left join lateral (
    select w.status,w.follow_up_at,w.note,w.updated_at
    from public.psp_client_work_v273 w
    join keyed k on k.client_key=w.client_key and k.person_key=r.person_key
    order by w.updated_at desc
    limit 1
  ) wrk on true

  order by g.first_seen_at desc nulls last,r.client_key
  limit v_limit;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_performance_range_v359(p_session_token text, p_start_date date, p_end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_team text:=public.psp_team_member_from_session_v206(p_session_token);
  sd date:=coalesce(p_start_date,(now() at time zone 'Asia/Kuala_Lumpur')::date);
  ed date:=coalesce(p_end_date,coalesce(p_start_date,(now() at time zone 'Asia/Kuala_Lumpur')::date));
  sts timestamptz;
  ets timestamptz;
  base jsonb;
  b1 integer:=0;b2 integer:=0;b3 integer:=0;
  f1 integer:=0;f2 integer:=0;fund integer:=0;
  adv integer:=0;advfund integer:=0;
begin
  if v_team is null then raise exception 'Invalid or expired Team Panel session.'; end if;
  if ed<sd then raise exception 'End date cannot be before start date.'; end if;
  if ed-sd>370 then raise exception 'Custom range cannot exceed 371 days.'; end if;

  base:=public.psp_team_performance_range_v207(p_session_token,sd,ed);
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
    join public.team_client_attribution_v206 a on a.user_id=ce.user_id
    where a.team_member_id=v_team
      and (
        lower(coalesce(ce.enrollment_status,''))='enrolled'
        or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
        or lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')
      )
      and coalesce(ce.access_granted_at,ce.reviewed_at,ce.updated_at,ce.created_at)>=sts
      and coalesce(ce.access_granted_at,ce.reviewed_at,ce.updated_at,ce.created_at)<ets
  )
  select
    count(distinct user_id) filter(
      where family='free' and (
        batch_key='basic_b1'
        or (batch_key not in ('basic_b1','basic_b2','basic_b3')
            and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date<date '2026-09-01')
      )
    )::integer,
    count(distinct user_id) filter(
      where family='free' and (
        batch_key='basic_b2'
        or (batch_key not in ('basic_b1','basic_b2','basic_b3')
            and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date>=date '2026-09-01'
            and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date<date '2026-09-16')
      )
    )::integer,
    count(distinct user_id) filter(
      where family='free' and (
        batch_key='basic_b3'
        or (batch_key not in ('basic_b1','basic_b2','basic_b3')
            and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date>=date '2026-09-16')
      )
    )::integer,
    count(distinct user_id) filter(where family='fundamental')::integer,
    count(distinct user_id) filter(
      where family='fundamental' and (
        batch_key='fundamental_b1'
        or (batch_key not in ('fundamental_b1','fundamental_b2')
            and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date<date '2026-09-16')
      )
    )::integer,
    count(distinct user_id) filter(
      where family='fundamental' and (
        batch_key='fundamental_b2'
        or (batch_key not in ('fundamental_b1','fundamental_b2')
            and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date>=date '2026-09-16')
      )
    )::integer,
    count(distinct user_id) filter(where family='advanced')::integer,
    count(distinct user_id) filter(where family='advance_fundamental')::integer
  into b1,b2,b3,fund,f1,f2,adv,advfund
  from ok;

  return base || jsonb_build_object(
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
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_search_client_v359(p_session_token text, p_query text, p_limit integer DEFAULT 30)
 RETURNS TABLE(client_key text, user_id uuid, client_id text, full_name text, email text, whatsapp text, course_text text, manager_id text, manager_name text, manager_whatsapp text, ownership_state text, work_status text, follow_up_at timestamp with time zone, last_activity_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_member_id text;
  v_q text:=lower(trim(coalesce(p_query,'')));
  v_limit integer:=greatest(1,least(coalesce(p_limit,30),50));
begin
  v_member_id:=public.psp_team_member_id_from_session_v245(p_session_token);
  if v_member_id is null then raise exception 'Team session is invalid or expired.'; end if;
  if length(v_q)<2 then return; end if;

  return query
  with base as (
    select
      o.client_key,o.user_id,o.team_member_id,o.assigned_at,o.updated_at,
      coalesce(nullif(o.client_id,''),p.client_id,'')::text as client_id,
      coalesce(nullif(o.full_name,''),nullif(p.full_name,''),split_part(coalesce(o.email,p.email,''),'@',1),'Client')::text as full_name,
      coalesce(nullif(o.email,''),p.email,'')::text as email,
      coalesce(nullif(o.whatsapp,''),nullif(p.whatsapp,''),p.phone,'')::text as whatsapp,
      lower(regexp_replace(trim(coalesce(nullif(o.full_name,''),nullif(p.full_name,''),'')),'\s+',' ','g')) as name_norm,
      regexp_replace(coalesce(nullif(o.whatsapp,''),nullif(p.whatsapp,''),p.phone,''),'[^0-9]','','g') as phone_norm
    from public.psp_client_owner_v273 o
    left join public.profiles p on p.id=o.user_id
    where lower(
      coalesce(o.full_name,'')||' '||coalesce(p.full_name,'')||' '||
      coalesce(o.email,'')||' '||coalesce(p.email,'')||' '||
      coalesce(o.client_id,'')||' '||coalesce(p.client_id,'')||' '||
      coalesce(o.whatsapp,'')||' '||coalesce(p.whatsapp,'')||' '||coalesce(p.phone,'')
    ) like '%'||v_q||'%'
  ),
  keyed as (
    select b.*,
      case when length(b.phone_norm)>=7 and nullif(b.name_norm,'') is not null
           then b.team_member_id||':person:'||b.phone_norm||':'||b.name_norm
           else b.team_member_id||':user:'||b.user_id::text end as person_key
    from base b
  ),
  rep as (
    select distinct on(person_key) *
    from keyed
    order by person_key,coalesce(assigned_at,updated_at) asc,updated_at desc
  )
  select
    r.client_key,r.user_id,r.client_id,r.full_name,r.email,r.whatsapp,
    coalesce(crs.labels,'No course')::text,
    r.team_member_id::text,
    coalesce(tm.display_name,tm.username,'Unassigned')::text,
    coalesce(tm.whatsapp_number,'')::text,
    case when r.team_member_id is null then 'unassigned'
         when r.team_member_id=v_member_id then 'mine'
         else 'other' end::text,
    coalesce(w.status,'new')::text,
    w.follow_up_at,
    coalesce(w.updated_at,'epoch'::timestamptz)
  from rep r
  left join public.team_members tm on tm.id::text=r.team_member_id
  left join public.psp_client_work_v273 w on w.client_key=r.client_key
  left join lateral (
    select string_agg(x.label,', ' order by x.label)::text as labels
    from (
      select distinct
        (coalesce(nullif(e.course_name,''),nullif(e.course_key,''),'Course')
          ||case when nullif(trim(coalesce(e.psp_batch_key,'')),'') is not null
                 then ' ['||lower(trim(e.psp_batch_key))||']' else '' end)::text as label
      from public.course_enrollments e
      join keyed k on k.user_id=e.user_id and k.person_key=r.person_key
      where lower(coalesce(e.enrollment_status,'')) not in ('cancelled','canceled','rejected','revoked')
        and lower(coalesce(e.payment_status,'')) not in ('rejected','revoked')
    ) x
  ) crs on true
  order by r.full_name
  limit v_limit;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_update_client_work_v359(p_session_token text, p_client_key text, p_status text, p_follow_up_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_member_id text;
  v_owner text;
  v_status text;
begin
  v_member_id:=public.psp_team_member_id_from_session_v245(p_session_token);
  if v_member_id is null then raise exception 'Team session is invalid or expired.'; end if;

  v_status:=lower(trim(coalesce(p_status,'new')));
  if v_status not in ('new','contacted','interested','follow_up','converted','not_interested') then
    raise exception 'Invalid client status.';
  end if;

  select o.team_member_id into v_owner
  from public.psp_client_owner_v273 o
  where o.client_key=p_client_key
  limit 1;

  if v_owner is null then raise exception 'Client ownership record was not found. Refresh My Clients and try again.'; end if;
  if v_owner<>v_member_id then raise exception 'This client belongs to another Team Member.'; end if;

  insert into public.psp_client_work_v273(
    client_key,status,follow_up_at,note,updated_by_team_member_id,updated_at
  )
  values(
    p_client_key,v_status,p_follow_up_at,nullif(trim(coalesce(p_note,'')),''),v_member_id,clock_timestamp()
  )
  on conflict(client_key) do update set
    status=excluded.status,
    follow_up_at=excluded.follow_up_at,
    note=coalesce(excluded.note,public.psp_client_work_v273.note),
    updated_by_team_member_id=v_member_id,
    updated_at=clock_timestamp();

  return jsonb_build_object('ok',true,'status',v_status,'follow_up_at',p_follow_up_at);
end;
$function$;

grant execute on function public.psp_team_clients_v359(text,integer) to anon,authenticated;
grant execute on function public.psp_team_update_client_work_v359(text,text,text,timestamptz,text) to anon,authenticated;
grant execute on function public.psp_team_performance_range_v359(text,date,date) to anon,authenticated;
grant execute on function public.psp_team_search_client_v359(text,text,integer) to anon,authenticated;
grant execute on function public.psp_team_client_export_v359(text,integer) to anon,authenticated;
