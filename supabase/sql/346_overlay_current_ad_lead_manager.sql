
create or replace function public.psp_admin_ad_leads_v307(p_limit integer default 1000)
returns setof public.psp_ad_submissions_v259
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.psp_is_admin()
     and coalesce(current_setting('request.jwt.claim.role',true),'') <> 'service_role' then
    raise exception 'Admin access required.';
  end if;

  return query
  with latest_assignment as (
    select distinct on (a.user_id)
      a.user_id,
      a.team_member_id,
      a.team_member_name,
      a.team_member_whatsapp,
      a.assigned_at
    from public.psp_lead_assignments a
    where a.user_id is not null
    order by a.user_id,a.assigned_at desc,a.created_at desc,a.id desc
  ),
  latest_owner as (
    select distinct on (o.user_id)
      o.user_id,
      o.team_member_id,
      o.updated_at,
      o.assigned_at
    from public.psp_client_owner_v273 o
    where o.user_id is not null
    order by o.user_id,o.updated_at desc,o.assigned_at desc
  ),
  eligible as (
    select s.*
    from public.psp_ad_submissions_v259 s
    where lower(to_jsonb(s)::text) not like '%freecourse2_chat%'
      and not exists(
        select 1
        from public.psp_fc2_enrollment_cache_v307 c
        where c.submission_id=coalesce(
          to_jsonb(s)->>'id',
          to_jsonb(s)->>'submission_id',
          to_jsonb(s)->>'lead_id'
        )
      )
  ),
  patched as (
    select
      s.created_at as sort_created_at,
      jsonb_populate_record(
        null::public.psp_ad_submissions_v259,
        to_jsonb(s) || jsonb_build_object(
          'team_member_id',
            coalesce(
              nullif(la.team_member_id,''),
              nullif(lo.team_member_id,''),
              nullif(s.team_member_id,'')
            ),
          'team_member_name',
            coalesce(
              nullif(la.team_member_name,''),
              nullif(tm.display_name,''),
              nullif(tm.username,''),
              nullif(s.team_member_name,'')
            ),
          'team_member_whatsapp',
            coalesce(
              nullif(la.team_member_whatsapp,''),
              nullif(tm.whatsapp_number,''),
              nullif(s.team_member_whatsapp,'')
            )
        )
      ) as rec
    from eligible s
    left join latest_assignment la on la.user_id=s.user_id
    left join latest_owner lo on lo.user_id=s.user_id
    left join public.team_members tm
      on tm.id::text=coalesce(
        nullif(la.team_member_id,''),
        nullif(lo.team_member_id,''),
        nullif(s.team_member_id,'')
      )
  )
  select (p.rec).*
  from patched p
  order by p.sort_created_at desc
  limit greatest(1,least(coalesce(p_limit,1000),5000));
end
$$;

revoke execute on function public.psp_admin_ad_leads_v307(integer) from public, anon;
grant execute on function public.psp_admin_ad_leads_v307(integer) to authenticated, service_role;
