-- PipSePaisa V484 — bind tracked-link identity to trusted caller.
-- Browser callers cannot assign tracking events to an arbitrary user UUID.
-- Authenticated callers are forced to auth.uid(); anonymous callers stay anonymous.
-- Only service_role may explicitly supply p_user_id.

create or replace function public.psp_record_tracked_link_event(
  p_slug text,
  p_event_type text default 'click'::text,
  p_visitor_id text default null::text,
  p_session_id text default null::text,
  p_user_id uuid default null::uuid,
  p_course_key text default null::text,
  p_page_path text default null::text,
  p_referrer text default null::text,
  p_user_agent text default null::text,
  p_metadata jsonb default '{}'::jsonb
)
returns table(
  link_id uuid,
  link_name text,
  destination_path text,
  source text,
  campaign text,
  event_recorded boolean
)
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_link public.tracked_links%rowtype;
  v_event text := lower(trim(coalesce(p_event_type, 'click')));
  v_role text := coalesce(auth.role(),'');
  v_auth_user uuid := auth.uid();
  v_user uuid;
  v_recorded boolean := false;
  v_metadata jsonb := case
    when octet_length(coalesce(p_metadata,'{}'::jsonb)::text) <= 8192
      then coalesce(p_metadata,'{}'::jsonb)
    else '{}'::jsonb
  end;
begin
  if v_event not in ('click','signup','enrollment') then
    raise exception 'Unsupported tracking event.';
  end if;

  if v_role = 'service_role' then
    v_user := p_user_id;
  else
    if v_auth_user is not null and p_user_id is not null and p_user_id <> v_auth_user then
      raise exception 'Tracking user mismatch.';
    end if;
    v_user := v_auth_user;
  end if;

  select * into v_link
  from public.tracked_links
  where lower(slug) = lower(trim(coalesce(p_slug, '')))
    and is_active = true
  limit 1;

  if not found then return; end if;

  begin
    insert into public.tracked_link_events (
      link_id,event_type,visitor_id,session_id,user_id,course_key,
      page_path,referrer,user_agent,metadata
    ) values (
      v_link.id,
      v_event,
      nullif(left(trim(coalesce(p_visitor_id, '')),120),''),
      nullif(left(trim(coalesce(p_session_id, '')),120),''),
      v_user,
      nullif(left(trim(coalesce(p_course_key, '')),80),''),
      nullif(left(trim(coalesce(p_page_path, '')),500),''),
      nullif(left(trim(coalesce(p_referrer, '')),1000),''),
      nullif(left(trim(coalesce(p_user_agent, '')),1000),''),
      v_metadata
    );
    v_recorded := true;
  exception when unique_violation then
    v_recorded := false;
  end;

  return query
  select v_link.id,v_link.name,v_link.destination_path,
         v_link.source,v_link.campaign,v_recorded;
end;
$function$;
