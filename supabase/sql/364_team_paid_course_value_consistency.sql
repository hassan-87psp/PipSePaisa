-- PipSePaisa V364 — paid-course metric consistency.
-- Recomputes auto paid sales from the same approved enrollments used for paid-user counts,
-- while preserving explicit admin course-value overrides.
-- Applied to production on 2026-09-30.

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
      coalesce(
        ce.access_granted_at,
        ce.reviewed_at,
        ce.updated_at,
        ce.created_at
      ) as event_at,
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
    join public.team_client_attribution_v206 a on a.user_id=ce.user_id
    where a.team_member_id=p_team_member_id
      and (
        lower(coalesce(ce.enrollment_status,''))='enrolled'
        or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
        or lower(coalesce(ce.provider_status,'')) in ('approved','paid','success','successful','completed','accepted')
      )
      and coalesce(ce.access_granted_at,ce.reviewed_at,ce.updated_at,ce.created_at)
          >= (d::timestamp at time zone 'Asia/Kuala_Lumpur')
      and coalesce(ce.access_granted_at,ce.reviewed_at,ce.updated_at,ce.created_at)
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
