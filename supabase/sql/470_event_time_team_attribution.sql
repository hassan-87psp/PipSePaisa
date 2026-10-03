-- V470 — historical/event-time team attribution
-- Later manager assignment/transfer must not rewrite an older sale.
-- Current ownership remains handled by current-owner/search RPCs.

create or replace function public.psp_team_member_at_event_v371(
  p_user_id uuid,
  p_event_at timestamptz
)
returns text
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_team text;
begin
  if p_user_id is null or p_event_at is null then
    return null;
  end if;

  select q.team_member_id
  into v_team
  from (
    select o.team_member_id::text as team_member_id,o.changed_at as event_at,50 as priority
    from public.psp_client_manager_override_v281 o
    where o.user_id=p_user_id
      and o.changed_at is not null
      and o.changed_at<=p_event_at

    union all

    select a.team_member_id::text,coalesce(a.assigned_at,a.created_at),40
    from public.psp_lead_assignments a
    where a.user_id=p_user_id
      and coalesce(a.assigned_at,a.created_at) is not null
      and coalesce(a.assigned_at,a.created_at)<=p_event_at

    union all

    select s.team_member_id::text,s.created_at,30
    from public.psp_ad_submissions_v259 s
    where s.user_id=p_user_id
      and s.created_at is not null
      and s.created_at<=p_event_at

    union all

    select a.team_member_id::text,a.attributed_at,20
    from public.team_client_attribution_v206 a
    where a.user_id=p_user_id
      and a.attributed_at is not null
      and a.attributed_at<=p_event_at

    union all

    select o.team_member_id::text,o.assigned_at,10
    from public.psp_client_owner_v273 o
    where o.user_id=p_user_id
      and o.assigned_at is not null
      and o.assigned_at<=p_event_at
  ) q
  where nullif(trim(coalesce(q.team_member_id,'')),'') is not null
  order by q.event_at desc nulls last,q.priority desc
  limit 1;

  return nullif(trim(coalesce(v_team,'')),'');
end;
$function$;

comment on function public.psp_team_member_at_event_v371(uuid,timestamptz)
is 'V470 event-time Team attribution: later manager assignments do not retroactively change older course commission/events.';
