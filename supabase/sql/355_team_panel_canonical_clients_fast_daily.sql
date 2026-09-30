-- PipSePaisa V355 — canonical Team Panel clients + fast set-based Daily History.
-- Applied to production on 2026-09-30.

CREATE OR REPLACE FUNCTION public.psp_team_clients_v355(p_session_token text, p_limit integer DEFAULT 3000)
 RETURNS TABLE(user_id uuid, client_key text, client_id text, full_name text, email text, whatsapp text, registration_at timestamp with time zone, source text, campaign text, reference_code text, course_enrollment text, vip_status text, broker text, broker_status text, account_mode text, conversion_status text, follow_up_at timestamp with time zone, work_note text, work_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_member_id text;
  v_limit integer := greatest(1,least(coalesce(p_limit,3000),5000));
begin
  v_member_id := public.psp_team_member_id_from_session_v245(p_session_token);
  if v_member_id is null then
    raise exception 'Team session is invalid or expired.';
  end if;

  return query
  select
    o.user_id,
    o.client_key,
    coalesce(nullif(o.client_id,''),nullif(p.client_id,''),'PSP-'||upper(substr(replace(o.user_id::text,'-',''),1,8)))::text,
    coalesce(nullif(o.full_name,''),nullif(p.full_name,''),split_part(coalesce(o.email,p.email,''),'@',1),'Client')::text,
    coalesce(nullif(o.email,''),p.email,'')::text,
    coalesce(nullif(o.whatsapp,''),nullif(p.whatsapp,''),p.phone,'')::text,
    coalesce(o.assigned_at,p.created_at)::timestamptz,
    (
      case
        when lower(coalesce(o.source,'')) ~ '(ad|round[ _-]*robin|auto)' then 'Ad / Auto'
        when lower(coalesce(o.source,'')) ~ '(override|specific|manager|transfer|assignment[ _-]*sync)' then 'Manager Transfer'
        else coalesce(nullif(o.source,''),nullif(a.source,''),'Assigned')
      end
    )::text,
    coalesce(nullif(a.campaign,''),'Current Assignment')::text,
    coalesce(nullif(a.reference_code,''),'OWNER')::text,
    coalesce(c.courses,'No course yet')::text,
    case when v.is_vip then 'VIP' else 'Not VIP' end::text,
    coalesce(b.broker,'—')::text,
    coalesce(b.broker_status,'—')::text,
    coalesce(b.account_mode,'—')::text,
    coalesce(w.status,
      case
        when v.is_vip
          or coalesce(c.has_active_course,false)
          or coalesce(b.is_approved,false)
        then 'converted'
        else 'new'
      end
    )::text,
    w.follow_up_at,
    w.note,
    coalesce(w.status,
      case
        when v.is_vip
          or coalesce(c.has_active_course,false)
          or coalesce(b.is_approved,false)
        then 'converted'
        else 'new'
      end
    )::text
  from public.psp_client_owner_v273 o
  left join public.profiles p on p.id=o.user_id
  left join public.psp_client_work_v273 w on w.client_key=o.client_key

  left join lateral (
    select
      ta.source::text,
      ta.campaign::text,
      ta.reference_code::text
    from public.team_client_attribution_v206 ta
    where ta.user_id=o.user_id
    limit 1
  ) a on true

  left join lateral (
    select
      string_agg(x.label, ', ' order by x.label)::text as courses,
      bool_or(x.is_active) as has_active_course
    from (
      select distinct
        (
          coalesce(nullif(ce.course_name,''),nullif(ce.course_key,''),'Course')
          || case
               when nullif(trim(coalesce(ce.psp_batch_key,'')),'') is not null
               then ' ['||lower(trim(ce.psp_batch_key))||']'
               else ''
             end
        )::text as label,
        (
          lower(coalesce(ce.enrollment_status,''))='enrolled'
          or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
          or lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')
        ) as is_active
      from public.course_enrollments ce
      where ce.user_id=o.user_id
        and lower(coalesce(ce.enrollment_status,'')) not in ('cancelled','canceled','rejected','revoked')
        and lower(coalesce(ce.payment_status,'')) not in ('rejected','revoked')
    ) x
  ) c on true

  left join lateral (
    select true as is_vip
    from public.payment_requests pr
    where pr.user_id=o.user_id
      and lower(coalesce(pr.status,'')) in ('approved','paid','success','successful','completed','accepted','confirmed','verified')
      and (
        lower(coalesce(to_jsonb(pr)->>'plan_name','')) like '%vip%'
        or lower(coalesce(pr.request_type,'')) like '%vip%'
        or coalesce(pr.amount,0)=50
      )
    order by coalesce(pr.reviewed_at,pr.updated_at,pr.created_at) desc
    limit 1
  ) v on true

  left join lateral (
    select
      upper(coalesce(nullif(av.broker,''),'—'))::text as broker,
      case
        when lower(coalesce(av.submission_status,'')) in ('approved','accepted','verified','completed') then 'Approved'
        else initcap(coalesce(nullif(av.submission_status,''),'Pending'))
      end::text as broker_status,
      case when coalesce(av.existing_account,false) then 'IB Shift' else 'New Account' end::text as account_mode,
      (lower(coalesce(av.submission_status,'')) in ('approved','accepted','verified','completed')) as is_approved
    from public.account_verifications av
    where av.user_id=o.user_id
    limit 1
  ) b on true

  where o.team_member_id=v_member_id
  order by coalesce(o.assigned_at,o.updated_at) desc nulls last,o.client_key
  limit v_limit;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_daily_history_v355(p_session_token text, p_month integer DEFAULT NULL::integer, p_year integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_team text := public.psp_team_member_from_session_v206(p_session_token);
  v_now date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  v_month integer := coalesce(p_month,extract(month from v_now)::integer);
  v_year integer := coalesce(p_year,extract(year from v_now)::integer);
  v_start date;
  v_end date;
  v_start_ts timestamptz;
  v_end_ts timestamptz;
  v_result jsonb;
begin
  if v_team is null then
    raise exception 'Invalid or expired Team Panel session.';
  end if;
  if v_month<1 or v_month>12 or v_year<2020 or v_year>2100 then
    raise exception 'Invalid month/year.';
  end if;

  v_start := make_date(v_year,v_month,1);
  v_end := (v_start + interval '1 month')::date;
  v_start_ts := v_start::timestamp at time zone 'Asia/Kuala_Lumpur';
  v_end_ts := v_end::timestamp at time zone 'Asia/Kuala_Lumpur';

  with
  manual as (
    select r.*
    from public.team_daily_activity_v206 r
    where r.team_member_id=v_team
      and r.report_date>=v_start
      and r.report_date<v_end
  ),
  regs as (
    select
      (a.attributed_at at time zone 'Asia/Kuala_Lumpur')::date as d,
      count(distinct a.user_id)::integer as registrations
    from public.team_client_attribution_v206 a
    where a.team_member_id=v_team
      and a.attributed_at>=v_start_ts
      and a.attributed_at<v_end_ts
    group by 1
  ),
  course_raw as (
    select
      ce.user_id,
      (coalesce(ce.access_granted_at,ce.reviewed_at,ce.updated_at,ce.created_at) at time zone 'Asia/Kuala_Lumpur')::date as d,
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
      and coalesce(ce.access_granted_at,ce.reviewed_at,ce.updated_at,ce.created_at)>=v_start_ts
      and coalesce(ce.access_granted_at,ce.reviewed_at,ce.updated_at,ce.created_at)<v_end_ts
  ),
  courses as (
    select
      cr.d,
      count(distinct cr.user_id) filter(
        where cr.family='free' and (
          cr.batch_key='basic_b1'
          or (cr.batch_key not in ('basic_b1','basic_b2','basic_b3')
              and (cr.attributed_at at time zone 'Asia/Kuala_Lumpur')::date < date '2026-09-01')
        )
      )::integer as b1,
      count(distinct cr.user_id) filter(
        where cr.family='free' and (
          cr.batch_key='basic_b2'
          or (cr.batch_key not in ('basic_b1','basic_b2','basic_b3')
              and (cr.attributed_at at time zone 'Asia/Kuala_Lumpur')::date >= date '2026-09-01'
              and (cr.attributed_at at time zone 'Asia/Kuala_Lumpur')::date < date '2026-09-16')
        )
      )::integer as b2,
      count(distinct cr.user_id) filter(
        where cr.family='free' and (
          cr.batch_key='basic_b3'
          or (cr.batch_key not in ('basic_b1','basic_b2','basic_b3')
              and (cr.attributed_at at time zone 'Asia/Kuala_Lumpur')::date >= date '2026-09-16')
        )
      )::integer as b3,
      count(distinct cr.user_id) filter(where cr.family='fundamental')::integer as fund,
      count(distinct cr.user_id) filter(
        where cr.family='fundamental' and (
          cr.batch_key='fundamental_b1'
          or (cr.batch_key not in ('fundamental_b1','fundamental_b2')
              and (cr.attributed_at at time zone 'Asia/Kuala_Lumpur')::date < date '2026-09-16')
        )
      )::integer as fund1,
      count(distinct cr.user_id) filter(
        where cr.family='fundamental' and (
          cr.batch_key='fundamental_b2'
          or (cr.batch_key not in ('fundamental_b1','fundamental_b2')
              and (cr.attributed_at at time zone 'Asia/Kuala_Lumpur')::date >= date '2026-09-16')
        )
      )::integer as fund2,
      count(distinct cr.user_id) filter(where cr.family='advanced')::integer as adv,
      count(distinct cr.user_id) filter(where cr.family='advance_fundamental')::integer as advfund
    from course_raw cr
    group by cr.d
  ),
  vip as (
    select
      (coalesce(pr.reviewed_at,pr.updated_at,pr.created_at) at time zone 'Asia/Kuala_Lumpur')::date as d,
      count(distinct pr.user_id)::integer as vip_joined
    from public.payment_requests pr
    join public.team_client_attribution_v206 a on a.user_id=pr.user_id
    where a.team_member_id=v_team
      and lower(coalesce(pr.status,'')) in ('approved','paid','success','successful','completed','accepted','confirmed','verified')
      and (
        lower(coalesce(to_jsonb(pr)->>'plan_name','')) like '%vip%'
        or lower(coalesce(pr.request_type,'')) like '%vip%'
        or coalesce(pr.amount,0)=50
      )
      and coalesce(pr.reviewed_at,pr.updated_at,pr.created_at)>=v_start_ts
      and coalesce(pr.reviewed_at,pr.updated_at,pr.created_at)<v_end_ts
    group by 1
  ),
  broker as (
    select
      (coalesce(av.reviewed_at,av.updated_at,av.submitted_at,av.created_at) at time zone 'Asia/Kuala_Lumpur')::date as d,
      count(distinct av.user_id) filter(where not coalesce(av.existing_account,false))::integer as new_accounts,
      count(distinct av.user_id) filter(where coalesce(av.existing_account,false))::integer as ib_shifts,
      count(distinct av.user_id) filter(where lower(coalesce(av.broker,''))='xm')::integer as xm_clients,
      count(distinct av.user_id) filter(where lower(coalesce(av.broker,'')) in ('dprime','doo prime','dooprime'))::integer as dprime_clients,
      count(distinct av.user_id) filter(where lower(coalesce(av.broker,''))='exness')::integer as exness_clients
    from public.account_verifications av
    join public.team_client_attribution_v206 a on a.user_id=av.user_id
    where a.team_member_id=v_team
      and lower(coalesce(av.submission_status,'')) in ('approved','accepted','verified','completed')
      and coalesce(av.reviewed_at,av.updated_at,av.submitted_at,av.created_at)>=v_start_ts
      and coalesce(av.reviewed_at,av.updated_at,av.submitted_at,av.created_at)<v_end_ts
    group by 1
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'manual',to_jsonb(m),
        'auto',jsonb_build_object(
          'report_date',m.report_date,
          'registrations',coalesce(r.registrations,0),
          'vip_joined',coalesce(v.vip_joined,0),
          'broker_account_created',coalesce(b.new_accounts,0),
          'ib_shift_completed',coalesce(b.ib_shifts,0),
          'batch1_enrollments',coalesce(c.b1,0),
          'batch2_enrollments',coalesce(c.b2,0),
          'batch3_enrollments',coalesce(c.b3,0),
          'fundamental_enrollments',coalesce(c.fund,0),
          'fundamental_b1_enrollments',coalesce(c.fund1,0),
          'fundamental_b2_enrollments',coalesce(c.fund2,0),
          'advance_enrollments',coalesce(c.adv,0),
          'advance_fundamental_enrollments',coalesce(c.advfund,0),
          'course_total',
            coalesce(c.b1,0)+coalesce(c.b2,0)+coalesce(c.b3,0)+
            coalesce(c.fund,0)+coalesce(c.adv,0)+coalesce(c.advfund,0),
          'xm_clients',coalesce(b.xm_clients,0),
          'dprime_clients',coalesce(b.dprime_clients,0),
          'exness_clients',coalesce(b.exness_clients,0),
          'weekly_xm_lots',coalesce(w.xm_lots,0),
          'weekly_dprime_lots',coalesce(w.dprime_lots,0),
          'weekly_exness_lots',coalesce(w.exness_lots,0),
          'weekly_total_lots',coalesce(w.xm_lots,0)+coalesce(w.dprime_lots,0)+coalesce(w.exness_lots,0),
          'xm_lots',coalesce(w.xm_lots,0),
          'dprime_lots',coalesce(w.dprime_lots,0),
          'exness_lots',coalesce(w.exness_lots,0),
          'total_lots',coalesce(w.xm_lots,0)+coalesce(w.dprime_lots,0)+coalesce(w.exness_lots,0)
        )
      )
      order by m.report_date desc
    ),
    '[]'::jsonb
  )
  into v_result
  from manual m
  left join regs r on r.d=m.report_date
  left join courses c on c.d=m.report_date
  left join vip v on v.d=m.report_date
  left join broker b on b.d=m.report_date
  left join public.team_broker_weekly_v207 w
    on w.team_member_id=v_team
   and w.week_start=date_trunc('week',m.report_date::timestamp)::date;

  return v_result;
end;
$function$;

grant execute on function public.psp_team_clients_v355(text,integer) to anon,authenticated;
grant execute on function public.psp_team_daily_history_v355(text,integer,integer) to anon,authenticated;
