-- PipSePaisa V371–V377 — payment-timeline based Team course commission logic.
-- Applied to production 2026-09-30.
-- Rules:
-- 1) Paid course month is determined by real approved payment/manual payment date.
-- 2) Commission manager is the manager who owned the client at the payment event.
-- 3) Later client transfers do not move historical commission.
-- 4) Current Assigned Date is first/current-manager assignment or explicit transfer date.
-- 5) Monthly Advance tabs use approved paid students for the selected month.

CREATE OR REPLACE FUNCTION public.psp_course_paid_event_at_v371(p_enrollment_id uuid)
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    case
      when ce.manual_payment_date is not null
        then ((ce.manual_payment_date::timestamp + interval '12 hours') at time zone 'Asia/Kuala_Lumpur')
      else coalesce(
        (
          select coalesce(cp.provider_callback_at,cp.updated_at,cp.created_at)
          from public.course_payments cp
          where cp.enrollment_id=ce.id
            and lower(coalesce(cp.status,'')) in ('approved','paid','success','successful','completed','accepted')
          order by coalesce(cp.provider_callback_at,cp.updated_at,cp.created_at) desc,cp.created_at desc
          limit 1
        ),
        case
          when lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')
            then coalesce(ce.provider_callback_at,ce.access_granted_at,ce.reviewed_at,ce.updated_at,ce.created_at)
        end,
        case
          when lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
            then coalesce(ce.reviewed_at,ce.access_granted_at,ce.updated_at,ce.created_at)
        end,
        case
          when lower(coalesce(ce.enrollment_status,''))='enrolled'
            then coalesce(ce.access_granted_at,ce.reviewed_at,ce.updated_at,ce.created_at)
        end
      )
    end
  from public.course_enrollments ce
  where ce.id=p_enrollment_id
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
    coalesce(public.psp_team_current_assignment_at_v371(r.user_id,r.client_key,v_member_id),g.first_seen_at)::timestamptz,
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
      where (
        lower(coalesce(ce.enrollment_status,''))='enrolled'
        or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
        or lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')
      )
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

CREATE OR REPLACE FUNCTION public.psp_team_current_assignment_at_v371(p_user_id uuid, p_client_key text, p_team_member_id text)
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with latest_transfer as (
    select l.new_team_member_id,l.changed_at
    from public.psp_client_transfer_log_v273 l
    join public.psp_client_owner_v273 o on o.client_key=l.client_key
    where (
      l.client_key=p_client_key
      or (p_user_id is not null and o.user_id=p_user_id)
    )
    order by l.changed_at desc,l.id desc
    limit 1
  ),
  first_assignment as (
    select min(q.ts) ts
    from (
      select a.attributed_at ts
      from public.team_client_attribution_v206 a
      where a.user_id=p_user_id and a.team_member_id=p_team_member_id

      union all
      select la.assigned_at
      from public.psp_lead_assignments la
      where la.user_id=p_user_id and la.team_member_id=p_team_member_id

      union all
      select s.created_at
      from public.psp_ad_submissions_v259 s
      where s.user_id=p_user_id and s.team_member_id=p_team_member_id

      union all
      select o.assigned_at
      from public.psp_client_owner_v273 o
      where o.user_id=p_user_id and o.team_member_id=p_team_member_id
    ) q
    where q.ts is not null
  )
  select case
    when exists(select 1 from latest_transfer lt where lt.new_team_member_id=p_team_member_id)
      then (select lt.changed_at from latest_transfer lt)
    else (select fa.ts from first_assignment fa)
  end
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_earnings_detail_v354(p_session_token text, p_month integer DEFAULT NULL::integer, p_year integer DEFAULT NULL::integer)
 RETURNS TABLE(row_type text, source_name text, client_name text, client_id text, detail text, event_at timestamp with time zone, basis numeric, basis_kind text, rate numeric, rate_kind text, commission numeric, sort_order integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_team text := public.psp_team_member_from_session_v206(p_session_token);
  v_now date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  v_m integer := coalesce(p_month,extract(month from v_now)::integer);
  v_y integer := coalesce(p_year,extract(year from v_now)::integer);
  v_d date;
  v_d2 date;
  v_metrics jsonb;
  v_course_rate numeric := 0;
  v_vip_rate numeric := 0;
  v_xm_rate numeric := 0;
  v_ex_rate numeric := 0;
  v_course_target_base numeric := 0;
  v_course_target_earn numeric := 0;
  v_vip_target_base numeric := 0;
  v_vip_target_earn numeric := 0;
  v_broker_target_earn numeric := 0;
  v_course_auto_base numeric := 0;
  v_course_rows_earn numeric := 0;
  v_vip_auto_base numeric := 0;
  v_vip_rows_earn numeric := 0;
  v_broker_rows_earn numeric := 0;
  v_weekly_count integer := 0;
begin
  if v_team is null then raise exception 'Invalid or expired Team Panel session.'; end if;
  if v_m<1 or v_m>12 or v_y<2020 or v_y>2100 then raise exception 'Invalid month/year.'; end if;

  v_d := make_date(v_y,v_m,1);
  v_d2 := (v_d + interval '1 month')::date;
  v_metrics := public.psp_team_metrics_core_v207(v_team,v_d);

  v_course_rate := coalesce((v_metrics->>'course_rate')::numeric,0);
  v_vip_rate := coalesce((v_metrics->>'vip_rate')::numeric,0);
  v_xm_rate := coalesce((v_metrics->>'xm_dprime_rate')::numeric,0);
  v_ex_rate := coalesce((v_metrics->>'exness_rate')::numeric,0);
  v_course_target_base := coalesce((v_metrics->>'course_performance')::numeric,0);
  v_course_target_earn := coalesce((v_metrics->>'course_earnings')::numeric,0);
  v_vip_target_base := coalesce((v_metrics->>'vip_value')::numeric,0);
  v_vip_target_earn := coalesce((v_metrics->>'vip_earnings')::numeric,0);
  v_broker_target_earn := coalesce((v_metrics->>'lot_earnings')::numeric,0);

  select coalesce(sum(coalesce(ce.price,0)),0),
         coalesce(sum(round(coalesce(ce.price,0)*v_course_rate/100,2)),0)
  into v_course_auto_base,v_course_rows_earn
  from public.course_enrollments ce
  where public.psp_team_member_at_event_v371(ce.user_id,public.psp_course_paid_event_at_v371(ce.id))=v_team
    and (
      lower(coalesce(ce.enrollment_status,''))='enrolled'
      or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
      or lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')
    )
    and public.psp_course_paid_event_at_v371(ce.id)
        >= (v_d::timestamp at time zone 'Asia/Kuala_Lumpur')
    and public.psp_course_paid_event_at_v371(ce.id)
        < (v_d2::timestamp at time zone 'Asia/Kuala_Lumpur')
    and coalesce(ce.price,0)>0;

  select coalesce(count(*)*50,0),
         coalesce(count(*)*round(50*v_vip_rate/100,2),0)
  into v_vip_auto_base,v_vip_rows_earn
  from public.payment_requests pr
  join public.team_client_attribution_v206 a on a.user_id=pr.user_id
  where a.team_member_id=v_team
    and lower(coalesce(pr.status,'')) in ('approved','paid','success','successful','completed','accepted','confirmed','verified')
    and (lower(coalesce(to_jsonb(pr)->>'plan_name','')) like '%vip%' or coalesce(pr.amount,0)=50)
    and coalesce(nullif(to_jsonb(pr)->>'approved_at','')::timestamptz,pr.updated_at,pr.created_at)
        >= (v_d::timestamp at time zone 'Asia/Kuala_Lumpur')
    and coalesce(nullif(to_jsonb(pr)->>'approved_at','')::timestamptz,pr.updated_at,pr.created_at)
        < (v_d2::timestamp at time zone 'Asia/Kuala_Lumpur');

  select count(*)::integer into v_weekly_count
  from public.team_broker_weekly_v207 w
  where w.team_member_id=v_team and w.week_start>=v_d and w.week_start<v_d2;

  if v_weekly_count>0 then
    select coalesce(sum(x.earn),0) into v_broker_rows_earn
    from (
      select round(coalesce(w.xm_lots,0)*v_xm_rate,2) earn
      from public.team_broker_weekly_v207 w where w.team_member_id=v_team and w.week_start>=v_d and w.week_start<v_d2 and coalesce(w.xm_lots,0)>0
      union all
      select round(coalesce(w.dprime_lots,0)*v_xm_rate,2)
      from public.team_broker_weekly_v207 w where w.team_member_id=v_team and w.week_start>=v_d and w.week_start<v_d2 and coalesce(w.dprime_lots,0)>0
      union all
      select round(coalesce(w.exness_lots,0)*v_ex_rate,2)
      from public.team_broker_weekly_v207 w where w.team_member_id=v_team and w.week_start>=v_d and w.week_start<v_d2 and coalesce(w.exness_lots,0)>0
    ) x;
  else
    v_broker_rows_earn := v_broker_target_earn;
  end if;

  return query
  with course_src as (
    select 'course'::text rt,
      coalesce(nullif(ce.course_name,''),nullif(ce.course_key,''),'Paid Course')::text sn,
      coalesce(nullif(p.full_name,''),nullif(ce.full_name,''),nullif(ce.email,''),'Client')::text cn,
      coalesce(nullif(p.client_id,''),'—')::text cid,
      ('Approved '||coalesce(nullif(ce.payment_status,''),nullif(ce.provider_status,''),nullif(ce.enrollment_status,''),'enrollment'))::text dt,
      public.psp_course_paid_event_at_v371(ce.id) ea,
      coalesce(ce.price,0)::numeric bs,'usd'::text bk,v_course_rate::numeric rr,'percent'::text rk,
      round(coalesce(ce.price,0)*v_course_rate/100,2)::numeric cm,10::integer so
    from public.course_enrollments ce
    left join public.profiles p on p.id=ce.user_id
    where public.psp_team_member_at_event_v371(ce.user_id,public.psp_course_paid_event_at_v371(ce.id))=v_team
      and (
        lower(coalesce(ce.enrollment_status,''))='enrolled'
        or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
        or lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')
      )
      and public.psp_course_paid_event_at_v371(ce.id)
          >= (v_d::timestamp at time zone 'Asia/Kuala_Lumpur')
      and public.psp_course_paid_event_at_v371(ce.id)
          < (v_d2::timestamp at time zone 'Asia/Kuala_Lumpur')
      and coalesce(ce.price,0)>0
  ),
  vip_src as (
    select 'vip'::text rt,'VIP Conversion'::text sn,
      coalesce(nullif(p.full_name,''),nullif(p.email,''),'Client')::text cn,
      coalesce(nullif(p.client_id,''),'—')::text cid,
      ('Approved '||coalesce(nullif(pr.status,''),'VIP payment'))::text dt,
      coalesce(nullif(to_jsonb(pr)->>'approved_at','')::timestamptz,pr.updated_at,pr.created_at) ea,
      50::numeric bs,'usd'::text bk,v_vip_rate::numeric rr,'percent'::text rk,
      round(50*v_vip_rate/100,2)::numeric cm,20::integer so
    from public.payment_requests pr
    join public.team_client_attribution_v206 a on a.user_id=pr.user_id
    left join public.profiles p on p.id=pr.user_id
    where a.team_member_id=v_team
      and lower(coalesce(pr.status,'')) in ('approved','paid','success','successful','completed','accepted','confirmed','verified')
      and (lower(coalesce(to_jsonb(pr)->>'plan_name','')) like '%vip%' or coalesce(pr.amount,0)=50)
      and coalesce(nullif(to_jsonb(pr)->>'approved_at','')::timestamptz,pr.updated_at,pr.created_at)
          >= (v_d::timestamp at time zone 'Asia/Kuala_Lumpur')
      and coalesce(nullif(to_jsonb(pr)->>'approved_at','')::timestamptz,pr.updated_at,pr.created_at)
          < (v_d2::timestamp at time zone 'Asia/Kuala_Lumpur')
  ),
  broker_weekly as (
    select 'broker'::text rt,'XM Broker Lots'::text sn,null::text cn,null::text cid,
      ('Week of '||to_char(w.week_start,'DD Mon YYYY'))::text dt,
      (w.week_start::timestamp at time zone 'Asia/Kuala_Lumpur') ea,
      coalesce(w.xm_lots,0)::numeric bs,'lots'::text bk,v_xm_rate::numeric rr,'usd_per_lot'::text rk,
      round(coalesce(w.xm_lots,0)*v_xm_rate,2)::numeric cm,30::integer so
    from public.team_broker_weekly_v207 w
    where v_weekly_count>0 and w.team_member_id=v_team and w.week_start>=v_d and w.week_start<v_d2 and coalesce(w.xm_lots,0)>0
    union all
    select 'broker','DPrime Broker Lots',null,null,('Week of '||to_char(w.week_start,'DD Mon YYYY')),
      (w.week_start::timestamp at time zone 'Asia/Kuala_Lumpur'),coalesce(w.dprime_lots,0),'lots',v_xm_rate,'usd_per_lot',
      round(coalesce(w.dprime_lots,0)*v_xm_rate,2),30
    from public.team_broker_weekly_v207 w
    where v_weekly_count>0 and w.team_member_id=v_team and w.week_start>=v_d and w.week_start<v_d2 and coalesce(w.dprime_lots,0)>0
    union all
    select 'broker','Exness Broker Lots',null,null,('Week of '||to_char(w.week_start,'DD Mon YYYY')),
      (w.week_start::timestamp at time zone 'Asia/Kuala_Lumpur'),coalesce(w.exness_lots,0),'lots',v_ex_rate,'usd_per_lot',
      round(coalesce(w.exness_lots,0)*v_ex_rate,2),30
    from public.team_broker_weekly_v207 w
    where v_weekly_count>0 and w.team_member_id=v_team and w.week_start>=v_d and w.week_start<v_d2 and coalesce(w.exness_lots,0)>0
  ),
  broker_legacy as (
    select 'broker'::text rt,'XM Broker Lots'::text sn,null::text cn,null::text cid,'Monthly broker total'::text dt,null::timestamptz ea,
      coalesce((v_metrics->>'xm_lots')::numeric,0) bs,'lots'::text bk,v_xm_rate rr,'usd_per_lot'::text rk,
      coalesce((v_metrics->>'xm_earnings')::numeric,0) cm,30::integer so
    where v_weekly_count=0 and coalesce((v_metrics->>'xm_lots')::numeric,0)>0
    union all
    select 'broker','DPrime Broker Lots',null,null,'Monthly broker total',null::timestamptz,
      coalesce((v_metrics->>'dprime_lots')::numeric,0),'lots',v_xm_rate,'usd_per_lot',
      coalesce((v_metrics->>'dprime_earnings')::numeric,0),30
    where v_weekly_count=0 and coalesce((v_metrics->>'dprime_lots')::numeric,0)>0
    union all
    select 'broker','Exness Broker Lots',null,null,'Monthly broker total',null::timestamptz,
      coalesce((v_metrics->>'exness_lots')::numeric,0),'lots',v_ex_rate,'usd_per_lot',
      coalesce((v_metrics->>'exness_earnings')::numeric,0),30
    where v_weekly_count=0 and coalesce((v_metrics->>'exness_lots')::numeric,0)>0
  ),
  adjustments as (
    select 'adjustment'::text rt,'Course Adjustment'::text sn,null::text cn,null::text cid,
      'Admin override / reconciliation'::text dt,null::timestamptz ea,
      (v_course_target_base-v_course_auto_base)::numeric bs,'usd'::text bk,v_course_rate rr,'percent'::text rk,
      (v_course_target_earn-v_course_rows_earn)::numeric cm,15::integer so
    where abs(v_course_target_base-v_course_auto_base)>0.004 or abs(v_course_target_earn-v_course_rows_earn)>0.004
    union all
    select 'adjustment','VIP Adjustment',null,null,'Admin override / reconciliation',null::timestamptz,
      (v_vip_target_base-v_vip_auto_base),'usd',v_vip_rate,'percent',(v_vip_target_earn-v_vip_rows_earn),25
    where abs(v_vip_target_base-v_vip_auto_base)>0.004 or abs(v_vip_target_earn-v_vip_rows_earn)>0.004
    union all
    select 'adjustment','Broker Rounding Adjustment',null,null,'Monthly reconciliation',null::timestamptz,
      0::numeric,'usd',null::numeric,'none',(v_broker_target_earn-v_broker_rows_earn),35
    where abs(v_broker_target_earn-v_broker_rows_earn)>0.004
  ),
  all_rows as (
    select rt,sn,cn,cid,dt,ea,bs,bk,rr,rk,cm,so from course_src
    union all select rt,sn,cn,cid,dt,ea,bs,bk,rr,rk,cm,so from vip_src
    union all select rt,sn,cn,cid,dt,ea,bs,bk,rr,rk,cm,so from broker_weekly
    union all select rt,sn,cn,cid,dt,ea,bs,bk,rr,rk,cm,so from broker_legacy
    union all select rt,sn,cn,cid,dt,ea,bs,bk,rr,rk,cm,so from adjustments
  )
  select ar.rt,ar.sn,ar.cn,ar.cid,ar.dt,ar.ea,ar.bs,ar.bk,ar.rr,ar.rk,ar.cm,ar.so
  from all_rows ar
  order by ar.so,ar.ea desc nulls last,ar.sn;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_member_at_event_v371(p_user_id uuid, p_event_at timestamp with time zone)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_team text;
  v_first_transfer record;
  v_known_before boolean:=false;
begin
  if p_user_id is null or p_event_at is null then return null; end if;

  -- Any explicit transfer effective on/before the earning event wins.
  select l.new_team_member_id
    into v_team
  from public.psp_client_transfer_log_v273 l
  join public.psp_client_owner_v273 o on o.client_key=l.client_key
  where o.user_id=p_user_id
    and l.changed_at<=p_event_at
  order by l.changed_at desc,l.id desc
  limit 1;

  if nullif(trim(coalesce(v_team,'')),'') is not null then return v_team; end if;

  -- If a transfer happened later, the old manager remains the owner before that transfer,
  -- but only when we have evidence the client was already assigned by the event time.
  select l.old_team_member_id,l.changed_at
    into v_first_transfer
  from public.psp_client_transfer_log_v273 l
  join public.psp_client_owner_v273 o on o.client_key=l.client_key
  where o.user_id=p_user_id
    and l.changed_at>p_event_at
  order by l.changed_at asc,l.id asc
  limit 1;

  if found then
    select exists(
      select 1
      from (
        select a.attributed_at ts from public.team_client_attribution_v206 a where a.user_id=p_user_id
        union all
        select la.assigned_at from public.psp_lead_assignments la where la.user_id=p_user_id
        union all
        select s.created_at from public.psp_ad_submissions_v259 s where s.user_id=p_user_id
        union all
        select o.assigned_at from public.psp_client_owner_v273 o where o.user_id=p_user_id
      ) q
      where q.ts is not null and q.ts<=p_event_at
    ) into v_known_before;

    if v_known_before and nullif(trim(coalesce(v_first_transfer.old_team_member_id,'')),'') is not null then
      return v_first_transfer.old_team_member_id;
    end if;
  end if;

  -- No applicable transfer: use the latest genuine assignment evidence available by event time.
  select q.team_member_id
    into v_team
  from (
    select a.team_member_id,a.attributed_at ts,40 priority
    from public.team_client_attribution_v206 a
    where a.user_id=p_user_id and a.attributed_at<=p_event_at

    union all
    select la.team_member_id,la.assigned_at,30
    from public.psp_lead_assignments la
    where la.user_id=p_user_id and la.assigned_at<=p_event_at

    union all
    select s.team_member_id,s.created_at,20
    from public.psp_ad_submissions_v259 s
    where s.user_id=p_user_id and s.created_at<=p_event_at

    union all
    select o.team_member_id,o.assigned_at,10
    from public.psp_client_owner_v273 o
    where o.user_id=p_user_id and o.assigned_at<=p_event_at
  ) q
  where nullif(trim(coalesce(q.team_member_id,'')),'') is not null
  order by q.ts desc,q.priority desc
  limit 1;

  return v_team;
end
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_metrics_core_v207(p_team_member_id text, p_period_month date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  d date:=date_trunc('month',coalesce(p_period_month,current_date))::date;
  d2 date:=(date_trunc('month',coalesce(p_period_month,current_date))+interval '1 month')::date;
  base jsonb:=public.psp_team_metrics_core_v206(p_team_member_id,p_period_month);
  paid_users integer:=0;
  batch1_users integer:=0;
  batch2_users integer:=0;
  batch3_users integer:=0;
  fundamental_users integer:=0;
  fundamental_b1_users integer:=0;
  fundamental_b2_users integer:=0;
  advance_users integer:=0;
  advance_fundamental_users integer:=0;
  course_auto_value numeric:=0;
  course_value numeric:=coalesce((base->>'course_performance')::numeric,0);
  course_rate numeric:=0;
  course_earnings numeric:=0;
  course_level text:='Level 1';
  course_next_target integer:=101;
  course_next_rate numeric:=4;
  course_remaining integer:=0;
  weekly_rows integer:=0;
  xl numeric:=0; dl numeric:=0; el numeric:=0;
  overall numeric:=0; xr numeric:=0; er numeric:=0;
  xe numeric:=0; de numeric:=0; ee numeric:=0; le numeric:=0;
  lot_level text; lot_next numeric; lot_remaining numeric;
  next_xr numeric; next_er numeric; next_est numeric; next_gain numeric;
  vip_earn numeric:=coalesce((base->>'vip_earnings')::numeric,0);
  total_earn numeric:=0;
begin
  with ok as (
    select
      ce.user_id,
      a.attributed_at,
      lower(coalesce(ce.psp_batch_key,'')) as batch_key,
      public.psp_course_paid_event_at_v371(ce.id) as event_at,
      coalesce(ce.price,0) as price,
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
    where public.psp_team_member_at_event_v371(ce.user_id,public.psp_course_paid_event_at_v371(ce.id))=p_team_member_id
      and (
        lower(coalesce(ce.enrollment_status,''))='enrolled'
        or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
        or lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')
      )
      and public.psp_course_paid_event_at_v371(ce.id)
          >= (d::timestamp at time zone 'Asia/Kuala_Lumpur')
      and public.psp_course_paid_event_at_v371(ce.id)
          < (d2::timestamp at time zone 'Asia/Kuala_Lumpur')
  )
  select
    coalesce(sum(price) filter(where price>0),0)::numeric,
    count(distinct user_id) filter(where price>0)::integer,
    count(distinct user_id) filter(
      where family='free' and (
        batch_key='basic_b1'
        or (batch_key not in ('basic_b1','basic_b2','basic_b3')
            and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date < date '2026-09-01')
      )
    )::integer,
    count(distinct user_id) filter(
      where family='free' and (
        batch_key='basic_b2'
        or (batch_key not in ('basic_b1','basic_b2','basic_b3')
            and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date >= date '2026-09-01'
            and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date < date '2026-09-16')
      )
    )::integer,
    count(distinct user_id) filter(
      where family='free' and (
        batch_key='basic_b3'
        or (batch_key not in ('basic_b1','basic_b2','basic_b3')
            and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date >= date '2026-09-16')
      )
    )::integer,
    count(distinct user_id) filter(where family='fundamental')::integer,
    count(distinct user_id) filter(
      where family='fundamental' and (
        batch_key='fundamental_b1'
        or (batch_key not in ('fundamental_b1','fundamental_b2')
            and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date < date '2026-09-16')
      )
    )::integer,
    count(distinct user_id) filter(
      where family='fundamental' and (
        batch_key='fundamental_b2'
        or (batch_key not in ('fundamental_b1','fundamental_b2')
            and (attributed_at at time zone 'Asia/Kuala_Lumpur')::date >= date '2026-09-16')
      )
    )::integer,
    count(distinct user_id) filter(where family='advanced')::integer,
    count(distinct user_id) filter(where family='advance_fundamental')::integer
  into
    course_auto_value,
    paid_users,batch1_users,batch2_users,batch3_users,
    fundamental_users,fundamental_b1_users,fundamental_b2_users,
    advance_users,advance_fundamental_users
  from ok;

  paid_users:=coalesce(paid_users,0);
  batch1_users:=coalesce(batch1_users,0);
  batch2_users:=coalesce(batch2_users,0);
  batch3_users:=coalesce(batch3_users,0);
  fundamental_users:=coalesce(fundamental_users,0);
  fundamental_b1_users:=coalesce(fundamental_b1_users,0);
  fundamental_b2_users:=coalesce(fundamental_b2_users,0);
  advance_users:=coalesce(advance_users,0);
  advance_fundamental_users:=coalesce(advance_fundamental_users,0);
  course_auto_value:=coalesce(course_auto_value,0);

  if coalesce((base->>'course_override')::boolean,false) then
    course_value:=coalesce((base->>'course_performance')::numeric,0);
  else
    course_value:=course_auto_value;
  end if;

  course_rate:=public.psp_course_rate_v207(paid_users);
  course_earnings:=round(course_value*course_rate/100,2);

  if paid_users<=100 then
    course_level:='Level 1';course_next_target:=101;course_next_rate:=4;
  elsif paid_users<=200 then
    course_level:='Level 2';course_next_target:=201;course_next_rate:=5;
  elsif paid_users<500 then
    course_level:='Level 3';course_next_target:=500;course_next_rate:=7;
  else
    course_level:='Maximum';course_next_target:=null;course_next_rate:=null;
  end if;
  course_remaining:=case when course_next_target is null then 0 else greatest(course_next_target-paid_users,0) end;

  select count(*)::integer,coalesce(sum(w.xm_lots),0),coalesce(sum(w.dprime_lots),0),coalesce(sum(w.exness_lots),0)
  into weekly_rows,xl,dl,el
  from public.team_broker_weekly_v207 w
  where w.team_member_id=p_team_member_id and w.week_start>=d and w.week_start<d2;

  if coalesce(weekly_rows,0)=0 then
    xl:=coalesce((base->>'xm_lots')::numeric,0);
    dl:=coalesce((base->>'dprime_lots')::numeric,0);
    el:=coalesce((base->>'exness_lots')::numeric,0);
  end if;

  overall:=coalesce(xl,0)+coalesce(dl,0)+coalesce(el,0);
  xr:=public.psp_lot_xm_rate_v206(overall);
  er:=public.psp_lot_exness_rate_v206(overall);
  xe:=round(xl*xr,2);de:=round(dl*xr,2);ee:=round(el*er,2);le:=xe+de+ee;

  if overall<=200 then lot_level:='200-Lot Tier';lot_next:=201;next_xr:=1.3;next_er:=0.5;
  elsif overall<=400 then lot_level:='400-Lot Tier';lot_next:=401;next_xr:=1.5;next_er:=0.7;
  elsif overall<1000 then lot_level:='600-Lot Tier';lot_next:=1000;next_xr:=2.0;next_er:=1.0;
  else lot_level:='1000+ Tier';lot_next:=null;next_xr:=null;next_er:=null;end if;
  lot_remaining:=case when lot_next is null then 0 else greatest(lot_next-overall,0) end;
  next_est:=case when lot_next is null then le else round(xl*next_xr+dl*next_xr+el*next_er,2) end;
  next_gain:=case when lot_next is null then 0 else round(next_est-le,2) end;
  total_earn:=course_earnings+vip_earn+le;

  return base || jsonb_build_object(
    'course_paid_users',paid_users,
    'batch1_users',batch1_users,
    'batch2_users',batch2_users,
    'batch3_users',batch3_users,
    'fundamental_users',fundamental_users,
    'fundamental_b1_users',fundamental_b1_users,
    'fundamental_b2_users',fundamental_b2_users,
    'advance_users',advance_users,
    'advance_fundamental_users',advance_fundamental_users,
    'course_performance_auto',round(course_auto_value,2),
    'course_performance',round(course_value,2),
    'course_override',coalesce((base->>'course_override')::boolean,false),
    'course_rate',course_rate,
    'course_earnings',course_earnings,
    'course_level',course_level,
    'course_next_target',course_next_target,
    'course_next_rate',course_next_rate,
    'course_remaining',course_remaining,
    'course_tier_basis','paid_users',
    'xm_lots',round(xl,2),
    'dprime_lots',round(dl,2),
    'exness_lots',round(el,2),
    'overall_lots',round(overall,2),
    'xm_dprime_rate',xr,
    'exness_rate',er,
    'xm_earnings',xe,
    'dprime_earnings',de,
    'exness_earnings',ee,
    'lot_earnings',round(le,2),
    'lot_level',lot_level,
    'lot_next_target',lot_next,
    'lot_remaining',lot_remaining,
    'next_xm_dprime_rate',next_xr,
    'next_exness_rate',next_er,
    'next_level_estimated_earnings',next_est,
    'next_level_estimated_gain',next_gain,
    'lots_source',case when coalesce(weekly_rows,0)>0 then 'weekly' else 'legacy_monthly' end,
    'total_earnings',round(total_earn,2)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_paid_course_clients_v377(p_session_token text, p_month integer, p_year integer)
 RETURNS TABLE(user_id uuid, client_key text, client_id text, full_name text, email text, whatsapp text, course_key text, course_name text, course_family text, paid_at timestamp with time zone, amount numeric, commission_rate numeric, commission numeric, assignment_source text, assigned_at timestamp with time zone, current_team_member_id text, current_manager_name text, is_current_owner boolean, work_status text, follow_up_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_team text;
  v_start timestamptz;
  v_end timestamptz;
  v_paid_users integer:=0;
  v_rate numeric:=0;
begin
  v_team:=public.psp_team_member_id_from_session_v245(p_session_token);
  if v_team is null then raise exception 'Team session is invalid or expired.'; end if;
  if p_month<1 or p_month>12 or p_year<2020 or p_year>2100 then
    raise exception 'Invalid month/year.';
  end if;

  v_start:=(make_date(p_year,p_month,1)::timestamp at time zone 'Asia/Kuala_Lumpur');
  v_end:=((make_date(p_year,p_month,1)+interval '1 month')::timestamp at time zone 'Asia/Kuala_Lumpur');

  select count(distinct ce.user_id)::integer
    into v_paid_users
  from public.course_enrollments ce
  where coalesce(ce.price,0)>0
    and (
      lower(coalesce(ce.enrollment_status,''))='enrolled'
      or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
      or lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')
    )
    and public.psp_course_paid_event_at_v371(ce.id)>=v_start
    and public.psp_course_paid_event_at_v371(ce.id)<v_end
    and public.psp_team_member_at_event_v371(
      ce.user_id,public.psp_course_paid_event_at_v371(ce.id)
    )=v_team;

  v_rate:=public.psp_course_rate_v207(coalesce(v_paid_users,0));

  return query
  with e as (
    select
      ce.id,
      ce.user_id,
      ce.course_key,
      ce.course_name,
      ce.full_name enrollment_name,
      ce.email enrollment_email,
      ce.whatsapp enrollment_whatsapp,
      coalesce(ce.price,0)::numeric amount,
      public.psp_course_paid_event_at_v371(ce.id) paid_at,
      case
        when lower(coalesce(ce.course_segment,'')) in ('advance_fundamental','advanced_fundamental')
          or lower(coalesce(ce.course_key,'')) in ('advance-fundamental','advanced-fundamental','advance_fundamental','advanced_fundamental')
          or lower(coalesce(ce.course_name,'')) like '%advance%fundamental%'
          or lower(coalesce(ce.course_name,'')) like '%advanced%fundamental%'
          then 'advance_fund'
        when lower(coalesce(ce.course_segment,''))='advanced'
          or lower(coalesce(ce.course_key,''))='advanced'
          or lower(coalesce(ce.course_name,'')) like '%advanced forex%'
          then 'advance'
        else 'other_paid'
      end family
    from public.course_enrollments ce
    where coalesce(ce.price,0)>0
      and (
        lower(coalesce(ce.enrollment_status,''))='enrolled'
        or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
        or lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')
      )
      and public.psp_course_paid_event_at_v371(ce.id)>=v_start
      and public.psp_course_paid_event_at_v371(ce.id)<v_end
      and public.psp_team_member_at_event_v371(
        ce.user_id,public.psp_course_paid_event_at_v371(ce.id)
      )=v_team
  )
  select
    e.user_id,
    coalesce(o.client_key,'u:'||e.user_id::text)::text,
    coalesce(nullif(p.client_id,''),nullif(o.client_id,''),'PSP-'||upper(substr(replace(e.user_id::text,'-',''),1,8)))::text,
    coalesce(nullif(p.full_name,''),nullif(o.full_name,''),nullif(e.enrollment_name,''),split_part(coalesce(p.email,o.email,e.enrollment_email,''),'@',1),'Client')::text,
    coalesce(nullif(p.email,''),nullif(o.email,''),e.enrollment_email,'')::text,
    coalesce(nullif(p.whatsapp,''),nullif(p.phone,''),nullif(o.whatsapp,''),e.enrollment_whatsapp,'')::text,
    coalesce(e.course_key,'')::text,
    coalesce(nullif(e.course_name,''),nullif(e.course_key,''),'Paid Course')::text,
    e.family::text,
    e.paid_at,
    e.amount,
    v_rate::numeric,
    round(e.amount*v_rate/100,2)::numeric,
    coalesce(src.source,'Assigned')::text,
    src.assigned_at,
    o.team_member_id::text,
    coalesce(tm.display_name,tm.username,'')::text,
    (o.team_member_id=v_team)::boolean,
    case when o.team_member_id=v_team then coalesce(w.status,'new') else 'transferred' end::text,
    case when o.team_member_id=v_team then w.follow_up_at else null end
  from e
  left join public.profiles p on p.id=e.user_id
  left join public.psp_client_owner_v273 o on o.user_id=e.user_id
  left join public.team_members tm on tm.id::text=o.team_member_id
  left join public.psp_client_work_v273 w on w.client_key=o.client_key
  left join lateral (
    select q.source,q.assigned_at
    from (
      select coalesce(nullif(a.source,''),'Tracked Link')::text source,a.attributed_at assigned_at,40 priority
      from public.team_client_attribution_v206 a
      where a.user_id=e.user_id and a.attributed_at<=e.paid_at

      union all
      select 'Round Robin'::text,la.assigned_at,30
      from public.psp_lead_assignments la
      where la.user_id=e.user_id and la.assigned_at<=e.paid_at

      union all
      select 'Ad / Auto'::text,s.created_at,20
      from public.psp_ad_submissions_v259 s
      where s.user_id=e.user_id and s.created_at<=e.paid_at

      union all
      select coalesce(nullif(oo.source,''),'Assigned')::text,oo.assigned_at,10
      from public.psp_client_owner_v273 oo
      where oo.user_id=e.user_id and oo.assigned_at<=e.paid_at
    ) q
    order by q.assigned_at desc,q.priority desc
    limit 1
  ) src on true
  order by e.paid_at desc,e.course_name,e.user_id;
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

grant execute on function public.psp_course_paid_event_at_v371(uuid) to anon,authenticated;
grant execute on function public.psp_team_member_at_event_v371(uuid,timestamptz) to anon,authenticated;
grant execute on function public.psp_team_current_assignment_at_v371(uuid,text,text) to anon,authenticated;
grant execute on function public.psp_team_paid_course_clients_v377(text,integer,integer) to anon,authenticated;
