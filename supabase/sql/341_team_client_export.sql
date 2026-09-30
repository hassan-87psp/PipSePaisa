
create or replace function public.psp_team_client_export_v341(p_session_token text, p_limit integer default 5000)
returns table(
  client_id text,
  full_name text,
  whatsapp text,
  assigned_manager text,
  registration_link text,
  course_batches text,
  assigned_at timestamptz
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_member_id text;
  v_limit integer:=greatest(1,least(coalesce(p_limit,5000),10000));
begin
  v_member_id:=public.psp_team_member_id_from_session_v245(p_session_token);
  if v_member_id is null then
    raise exception 'Team session is invalid or expired.';
  end if;

  return query
  with latest_assignment as (
    select distinct on (a.user_id)
      a.user_id,a.team_member_id,a.assigned_at,a.created_at,a.id
    from public.psp_lead_assignments a
    where a.user_id is not null
    order by a.user_id,a.assigned_at desc,a.created_at desc,a.id desc
  ),
  latest_owner as (
    select distinct on (o.user_id)
      o.user_id,o.team_member_id,o.client_id,o.full_name,o.email,o.whatsapp,o.assigned_at,o.updated_at
    from public.psp_client_owner_v273 o
    where o.user_id is not null
    order by o.user_id,o.updated_at desc,o.assigned_at desc
  ),
  canonical as (
    select
      coalesce(a.user_id,o.user_id) as user_id,
      coalesce(a.team_member_id,o.team_member_id) as team_member_id,
      o.client_id,o.full_name,o.email,o.whatsapp,
      coalesce(a.assigned_at,o.assigned_at) as assigned_at
    from latest_assignment a
    full join latest_owner o using(user_id)
  )
  select
    coalesce(nullif(c.client_id,''),nullif(p.client_id,''),'')::text,
    coalesce(nullif(c.full_name,''),nullif(p.full_name,''),split_part(coalesce(c.email,p.email,''),'@',1),'Client')::text,
    coalesce(nullif(c.whatsapp,''),nullif(p.whatsapp,''),nullif(p.phone,''),'')::text,
    coalesce(nullif(tm.display_name,''),nullif(tm.username,''),'Team Member')::text,
    coalesce(
      case
        when nullif(attr.slug,'') is not null then
          'https://pipsepaisa.com'
          || case
               when coalesce(attr.destination_path,'/') like '/%' then coalesce(attr.destination_path,'/')
               else '/'||coalesce(attr.destination_path,'')
             end
          || case when position('?' in coalesce(attr.destination_path,'/'))>0 then '&' else '?' end
          || 'ref='||attr.slug
        else null
      end,
      case
        when nullif(ad.source_path,'') is not null then
          'https://pipsepaisa.com'
          || case when ad.source_path like '/%' then ad.source_path else '/'||ad.source_path end
        else ''
      end
    )::text,
    coalesce(courses.labels,'')::text,
    c.assigned_at
  from canonical c
  left join public.profiles p on p.id=c.user_id
  left join public.team_members tm on tm.id::text=c.team_member_id
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
    where s.user_id=c.user_id
      and nullif(trim(coalesce(s.source_path,'')),'') is not null
    order by s.created_at desc
    limit 1
  ) ad on true
  left join lateral (
    select string_agg(x.label, ', ' order by x.label) labels
    from (
      select distinct
        (
          coalesce(nullif(e.course_name,''),nullif(e.course_key,''),'Course')
          || case
               when nullif(trim(coalesce(e.psp_batch_key,'')),'') is not null
               then ' ['||lower(trim(e.psp_batch_key))||']'
               else ''
             end
        )::text label
      from public.course_enrollments e
      where e.user_id=c.user_id
    ) x
  ) courses on true
  where c.team_member_id=v_member_id
  order by c.assigned_at desc nulls last,c.user_id
  limit v_limit;
end;
$function$;

revoke execute on function public.psp_team_client_export_v341(text,integer) from public;
grant execute on function public.psp_team_client_export_v341(text,integer) to anon, authenticated, service_role;
