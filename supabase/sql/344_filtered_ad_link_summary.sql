
create or replace function public.psp_admin_ad_link_summary_v344()
returns table(
  technical_clicks bigint,
  technical_unique_clicks bigint,
  technical_form_opens bigint,
  technical_form_submits bigint,
  technical_enrollments bigint,
  technical_whatsapp_routed bigint,
  fundamental_clicks bigint,
  fundamental_unique_clicks bigint,
  fundamental_form_opens bigint,
  fundamental_form_submits bigint,
  fundamental_enrollments bigint,
  fundamental_whatsapp_routed bigint,
  total_clicks bigint,
  total_unique_clicks bigint,
  total_form_opens bigint,
  total_form_submits bigint,
  total_enrollments bigint,
  total_whatsapp_routed bigint,
  active_team_count bigint,
  last_submission_at timestamptz,
  last_team_member_name text
)
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.psp_is_admin()
     and coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role' then
    raise exception 'Admin access required.';
  end if;

  return query
  with direct_events as (
    select e.*
    from public.psp_ad_events_v261 e
    where lower(coalesce(e.utm_source,'')) not in ('freecourse2','freecourse2_chat')
  ),
  direct_leads as (
    select s.*
    from public.psp_ad_submissions_v259 s
    where lower(to_jsonb(s)::text) not like '%freecourse2_chat%'
      and not exists (
        select 1
        from public.psp_fc2_enrollment_cache_v307 c
        where c.submission_id=coalesce(
          to_jsonb(s)->>'id',
          to_jsonb(s)->>'submission_id',
          to_jsonb(s)->>'lead_id'
        )
      )
  ),
  last_lead as (
    select s.created_at,s.team_member_name
    from direct_leads s
    order by s.created_at desc
    limit 1
  )
  select
    (select count(*)::bigint from direct_events e where e.course_code='technical' and e.event_type='click'),
    (select count(distinct coalesce(nullif(e.visitor_id,''),e.ip_hash,e.id::text))::bigint from direct_events e where e.course_code='technical' and e.event_type='click'),
    (select count(*)::bigint from direct_events e where e.course_code='technical' and e.event_type='form_open'),
    (select count(*)::bigint from direct_events e where e.course_code='technical' and e.event_type='form_submit'),
    (select count(*)::bigint from direct_leads s where s.course_code='technical'),
    (select count(*)::bigint from direct_leads s where s.course_code='technical' and (coalesce(s.whatsapp_routed,false)=true or length(regexp_replace(coalesce(s.team_member_whatsapp,''),'[^0-9]','','g'))>=8)),
    (select count(*)::bigint from direct_events e where e.course_code='fundamental' and e.event_type='click'),
    (select count(distinct coalesce(nullif(e.visitor_id,''),e.ip_hash,e.id::text))::bigint from direct_events e where e.course_code='fundamental' and e.event_type='click'),
    (select count(*)::bigint from direct_events e where e.course_code='fundamental' and e.event_type='form_open'),
    (select count(*)::bigint from direct_events e where e.course_code='fundamental' and e.event_type='form_submit'),
    (select count(*)::bigint from direct_leads s where s.course_code='fundamental'),
    (select count(*)::bigint from direct_leads s where s.course_code='fundamental' and (coalesce(s.whatsapp_routed,false)=true or length(regexp_replace(coalesce(s.team_member_whatsapp,''),'[^0-9]','','g'))>=8)),
    (select count(*)::bigint from direct_events e where e.event_type='click'),
    (select count(distinct coalesce(nullif(e.visitor_id,''),e.ip_hash,e.id::text))::bigint from direct_events e where e.event_type='click'),
    (select count(*)::bigint from direct_events e where e.event_type='form_open'),
    (select count(*)::bigint from direct_events e where e.event_type='form_submit'),
    (select count(*)::bigint from direct_leads),
    (select count(*)::bigint from direct_leads s where coalesce(s.whatsapp_routed,false)=true or length(regexp_replace(coalesce(s.team_member_whatsapp,''),'[^0-9]','','g'))>=8),
    (select count(*)::bigint from public.team_members tm where tm.is_active=true and coalesce(tm.lead_distribution_enabled,true)=true),
    (select created_at from last_lead),
    (select team_member_name::text from last_lead);
end;
$function$;

revoke execute on function public.psp_admin_ad_link_summary_v344() from public,anon;
grant execute on function public.psp_admin_ad_link_summary_v344() to authenticated,service_role;
