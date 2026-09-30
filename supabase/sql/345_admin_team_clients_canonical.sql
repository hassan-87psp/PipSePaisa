
create or replace function public.psp_admin_team_clients_v206(
  p_team_member_id text default null,
  p_limit integer default 2000
)
returns table(
  team_member_id text,
  team_member_name text,
  client_id text,
  full_name text,
  whatsapp text,
  registration_at timestamptz,
  source text,
  campaign text,
  reference_code text,
  course_enrollment text,
  vip_status text,
  broker text,
  broker_status text,
  account_mode text,
  conversion_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer:=greatest(1,least(coalesce(p_limit,2000),5000));
begin
  if not public.psp_is_admin() then
    raise exception 'Admin access required.';
  end if;

  return query
  with latest_assignment as (
    select distinct on (a.user_id)
      a.user_id,
      a.team_member_id::text as team_member_id,
      a.assigned_at
    from public.psp_lead_assignments a
    where a.user_id is not null
    order by a.user_id,a.assigned_at desc,a.created_at desc,a.id desc
  ),
  latest_owner as (
    select distinct on (o.user_id)
      o.user_id,
      o.team_member_id::text as team_member_id,
      o.client_id,o.full_name,o.email,o.whatsapp,
      o.assigned_at,o.updated_at
    from public.psp_client_owner_v273 o
    where o.user_id is not null
    order by o.user_id,o.updated_at desc,o.assigned_at desc
  ),
  latest_attr as (
    select distinct on (a.user_id)
      a.user_id,
      a.team_member_id::text as team_member_id,
      a.attributed_at,
      a.source,a.campaign,a.reference_code
    from public.team_client_attribution_v206 a
    where a.user_id is not null
    order by a.user_id,a.attributed_at desc,a.updated_at desc
  ),
  all_users as (
    select user_id from latest_assignment
    union
    select user_id from latest_owner
    union
    select user_id from latest_attr
  ),
  canonical as (
    select
      u.user_id,
      coalesce(la.team_member_id,lo.team_member_id,lt.team_member_id) as team_member_id,
      lo.client_id,lo.full_name,lo.email,lo.whatsapp,
      coalesce(la.assigned_at,lo.assigned_at,lt.attributed_at) as registration_at,
      coalesce(
        nullif(lt.source,''),
        case when la.user_id is not null then 'Assigned Lead'
             when lo.user_id is not null then 'Manager Assignment'
             else 'Other' end
      )::text as source,
      coalesce(nullif(lt.campaign,''),case when lo.user_id is not null then 'Admin' else 'No campaign' end)::text as campaign,
      coalesce(nullif(lt.reference_code,''),case when lo.user_id is not null then 'MANAGER' else '—' end)::text as reference_code
    from all_users u
    left join latest_assignment la using(user_id)
    left join latest_owner lo using(user_id)
    left join latest_attr lt using(user_id)
  )
  select
    c.team_member_id,
    coalesce(nullif(tm.display_name,''),nullif(tm.username,''),'Team Member')::text,
    coalesce(nullif(c.client_id,''),nullif(p.client_id,''),'PSP-'||upper(substr(replace(c.user_id::text,'-',''),1,8)))::text,
    coalesce(nullif(c.full_name,''),nullif(p.full_name,''),split_part(coalesce(c.email,p.email,''),'@',1),'User')::text,
    coalesce(nullif(c.whatsapp,''),nullif(p.whatsapp,''),nullif(p.phone,''),'')::text,
    coalesce(c.registration_at,p.created_at),
    c.source,
    c.campaign,
    c.reference_code,
    coalesce(course_data.courses,'None')::text,
    coalesce(v.vip_status,'Not VIP')::text,
    coalesce(b.broker,'—')::text,
    coalesce(b.broker_status,'—')::text,
    coalesce(b.account_mode,'—')::text,
    case
      when coalesce(v.vip_status,'')='VIP'
        or coalesce(course_data.courses,'')<>''
        or coalesce(b.broker_status,'') in ('Approved','Verified')
      then 'Converted'
      else 'Registered'
    end::text
  from canonical c
  left join public.team_members tm on tm.id::text=c.team_member_id
  left join public.profiles p on p.id=c.user_id
  left join lateral (
    select string_agg(x.label, ', ' order by x.label) as courses
    from (
      select distinct (
        coalesce(nullif(ce.course_name,''),nullif(ce.course_key,''),'Course')
        || case
             when nullif(trim(coalesce(ce.psp_batch_key,'')),'') is not null
             then ' ['||lower(trim(ce.psp_batch_key))||']'
             else ''
           end
      )::text as label
      from public.course_enrollments ce
      where ce.user_id=c.user_id
        and (
          lower(coalesce(ce.enrollment_status,''))='enrolled'
          or lower(coalesce(ce.payment_status,'')) in ('approved','paid','success','successful','completed','accepted')
        )
    ) x
  ) course_data on true
  left join lateral (
    select 'VIP'::text as vip_status
    from public.payment_requests pr
    where pr.user_id=c.user_id
      and lower(coalesce(to_jsonb(pr)->>'status','')) in ('approved','paid','success','successful','completed','accepted','confirmed','verified')
      and (
        lower(coalesce(to_jsonb(pr)->>'plan_name','')) like '%vip%'
        or coalesce(nullif(to_jsonb(pr)->>'amount','')::numeric,0)=50
      )
    limit 1
  ) v on true
  left join lateral (
    select
      upper(coalesce(nullif(to_jsonb(av)->>'broker',''),'—'))::text as broker,
      case
        when lower(coalesce(to_jsonb(av)->>'status',to_jsonb(av)->>'submission_status',''))
             in ('approved','accepted','verified','completed')
        then 'Approved'
        else initcap(coalesce(to_jsonb(av)->>'status',to_jsonb(av)->>'submission_status','Pending'))
      end::text as broker_status,
      case
        when lower(coalesce(to_jsonb(av)->>'existing_account','false')) in ('true','t','1','yes')
        then 'IB Shift'
        else 'New Account'
      end::text as account_mode
    from public.account_verifications av
    where av.user_id=c.user_id
    order by coalesce(
      nullif(to_jsonb(av)->>'updated_at','')::timestamptz,
      nullif(to_jsonb(av)->>'submitted_at','')::timestamptz,
      av.created_at
    ) desc
    limit 1
  ) b on true
  where (p_team_member_id is null or c.team_member_id=p_team_member_id)
  order by coalesce(c.registration_at,p.created_at) desc nulls last,c.user_id
  limit v_limit;
end
$$;
