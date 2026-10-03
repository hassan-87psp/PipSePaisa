-- V471 — transfer-aware event-time Team attribution
-- Current ownership stays current in Search/My Clients.
-- Dated sales/commission use the manager who owned the client at the event time.
-- Transfer history is authoritative because Admin transfer updates current owner/lead/ad rows in-place.

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
  v_baseline_start timestamptz;
  v_has_transfer boolean:=false;
begin
  if p_user_id is null or p_event_at is null then
    return null;
  end if;

  select exists(
    select 1
    from public.psp_client_transfer_log_v273 l
    join public.psp_client_owner_v273 o on o.client_key=l.client_key
    where o.user_id=p_user_id
  )
  into v_has_transfer;

  if v_has_transfer then
    select l.new_team_member_id::text
    into v_team
    from public.psp_client_transfer_log_v273 l
    join public.psp_client_owner_v273 o on o.client_key=l.client_key
    where o.user_id=p_user_id
      and l.changed_at<=p_event_at
    order by l.changed_at desc,l.id desc
    limit 1;

    if nullif(trim(coalesce(v_team,'')),'') is not null then
      return nullif(trim(v_team),'');
    end if;

    select min(q.ts)
    into v_baseline_start
    from (
      select o.assigned_at ts
      from public.psp_client_owner_v273 o
      where o.user_id=p_user_id

      union all

      select coalesce(a.assigned_at,a.created_at)
      from public.psp_lead_assignments a
      where a.user_id=p_user_id

      union all

      select s.created_at
      from public.psp_ad_submissions_v259 s
      where s.user_id=p_user_id

      union all

      select a.attributed_at
      from public.team_client_attribution_v206 a
      where a.user_id=p_user_id
    ) q
    where q.ts is not null;

    if v_baseline_start is not null and p_event_at>=v_baseline_start then
      select l.old_team_member_id::text
      into v_team
      from public.psp_client_transfer_log_v273 l
      join public.psp_client_owner_v273 o on o.client_key=l.client_key
      where o.user_id=p_user_id
        and l.changed_at>p_event_at
      order by l.changed_at asc,l.id asc
      limit 1;

      if nullif(trim(coalesce(v_team,'')),'') is not null then
        return nullif(trim(v_team),'');
      end if;
    end if;

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
is 'V471 transfer-aware event-time Team attribution. Current ownership stays current; dated sales and commission use ownership effective at the event time.';
