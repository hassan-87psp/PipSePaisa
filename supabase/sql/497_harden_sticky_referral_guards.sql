-- PipSePaisa V497 — harden sticky referral ownership.
-- Goals:
-- 1) Existing Team attribution stays sticky.
-- 2) Older Robot/Ad/Round-Robin acquisition cannot be stolen by a later Team link.
-- 3) Legacy tracking sync follows canonical ownership instead of latest link.
-- 4) Lead-assignment writes are corrected by a database-level owner guard.
-- 5) Obsolete repair RPC no longer has blanket PUBLIC execute.

CREATE OR REPLACE FUNCTION public.psp_capture_team_attribution_v206()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_owner text;
  v_link jsonb;
  v_event_at timestamptz := coalesce(new.created_at,clock_timestamp());
begin
  if new.user_id is null or new.link_id is null then return new; end if;

  if exists(select 1 from public.team_client_attribution_v206 a where a.user_id=new.user_id) then
    return new;
  end if;

  if exists(select 1 from public.psp_client_manager_override_v281 ov where ov.user_id=new.user_id)
     or public.psp_transfer_owner_v478(new.user_id) is not null
  then
    return new;
  end if;

  if exists(
       select 1 from public.psp_client_owner_v273 o
       where o.user_id=new.user_id
         and coalesce(o.assigned_at,o.updated_at) < v_event_at-interval '5 seconds'
     )
     or exists(
       select 1 from public.psp_ad_submissions_v259 s
       where s.user_id=new.user_id
         and s.created_at < v_event_at-interval '5 seconds'
     )
     or exists(
       select 1 from public.psp_lead_assignments la
       where la.user_id=new.user_id
         and coalesce(la.assigned_at,la.created_at) < v_event_at-interval '5 seconds'
     )
  then
    return new;
  end if;

  v_owner:=public.psp_team_owner_for_link_v206(new.link_id::text);
  if v_owner is null then return new; end if;

  select to_jsonb(tl) into v_link
  from public.tracked_links tl
  where tl.id::text=new.link_id::text
  limit 1;

  insert into public.team_client_attribution_v206(
    user_id,team_member_id,link_id,source,campaign,reference_code,attributed_at,updated_at
  ) values(
    new.user_id,v_owner,new.link_id::text,
    nullif(v_link->>'source',''),
    nullif(v_link->>'campaign',''),
    coalesce(nullif(v_link->>'slug',''),nullif(v_link->>'reference_code','')),
    v_event_at,clock_timestamp()
  )
  on conflict(user_id) do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_sync_legacy_tracking_owner_v273()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_team_id text;
  v_profile jsonb;
  v_email text;
  v_wa text;
  v_name text;
  v_client_id text;
  v_key text;
begin
  if new.user_id is null or new.link_id is null then return new; end if;

  v_team_id:=public.psp_expected_team_owner_v477(new.user_id);
  if nullif(trim(coalesce(v_team_id,'')),'') is null then
    v_team_id:=public.psp_team_owner_for_link_v206(new.link_id::text);
  end if;
  if nullif(trim(coalesce(v_team_id,'')),'') is null then return new; end if;

  select to_jsonb(p) into v_profile
  from public.profiles p
  where p.id=new.user_id;

  v_email:=coalesce(v_profile->>'email','');
  v_wa:=coalesce(v_profile->>'whatsapp',v_profile->>'phone','');
  v_name:=coalesce(nullif(v_profile->>'full_name',''),split_part(v_email,'@',1),'Client');
  v_client_id:=coalesce(v_profile->>'client_id','');
  v_key:=public.psp_client_key_v273(new.user_id,v_email,v_wa,v_client_id);
  if v_key is null then return new; end if;

  insert into public.psp_client_owner_v273(
    client_key,user_id,client_id,full_name,email,whatsapp,
    team_member_id,source,assigned_at,updated_at
  )
  values(
    v_key,new.user_id,v_client_id,v_name,lower(trim(v_email)),
    regexp_replace(coalesce(v_wa,''),'[^0-9+]','','g'),
    v_team_id,'Specific Assignment',coalesce(new.created_at,clock_timestamp()),clock_timestamp()
  )
  on conflict(client_key) do update set
    user_id=coalesce(excluded.user_id,public.psp_client_owner_v273.user_id),
    client_id=coalesce(nullif(excluded.client_id,''),public.psp_client_owner_v273.client_id),
    full_name=coalesce(nullif(excluded.full_name,''),public.psp_client_owner_v273.full_name),
    email=coalesce(nullif(excluded.email,''),public.psp_client_owner_v273.email),
    whatsapp=coalesce(nullif(excluded.whatsapp,''),public.psp_client_owner_v273.whatsapp),
    team_member_id=excluded.team_member_id,
    source=case
      when public.psp_client_owner_v273.team_member_id=excluded.team_member_id
           and nullif(trim(coalesce(public.psp_client_owner_v273.source,'')),'') is not null
        then public.psp_client_owner_v273.source
      when lower(coalesce(public.psp_client_owner_v273.source,'')) ~ '(admin[ _-]*(transfer|override)|manager[ _-]*transfer|manual[ _-]*(transfer|override))'
        then public.psp_client_owner_v273.source
      else 'Specific Assignment'
    end,
    updated_at=clock_timestamp();

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_lead_assignment_owner_guard_v497()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_expected text;
  v_name text;
  v_wa text;
begin
  if new.user_id is null then return new; end if;

  v_expected:=public.psp_expected_team_owner_v477(new.user_id);
  if nullif(trim(coalesce(v_expected,'')),'') is null then return new; end if;

  if new.team_member_id is distinct from v_expected then
    select
      coalesce(nullif(trim(t.display_name),''),nullif(trim(t.username),''),'PipSePaisa Team'),
      regexp_replace(coalesce(t.whatsapp_number,''),'[^0-9]','','g')
    into v_name,v_wa
    from public.team_members t
    where t.id::text=v_expected
    limit 1;

    new.team_member_id:=v_expected;
    if v_name is not null then new.team_member_name:=v_name; end if;
    if length(coalesce(v_wa,''))>=8 then new.team_member_whatsapp:=v_wa; end if;
  end if;

  return new;
end;
$function$;

DROP TRIGGER IF EXISTS aa_psp_lead_assignment_owner_guard_v497 ON public.psp_lead_assignments;
CREATE TRIGGER aa_psp_lead_assignment_owner_guard_v497
BEFORE INSERT OR UPDATE OF team_member_id,user_id
ON public.psp_lead_assignments
FOR EACH ROW
EXECUTE FUNCTION public.psp_lead_assignment_owner_guard_v497();

REVOKE ALL ON FUNCTION public.psp_lead_assignment_owner_guard_v497() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.psp_lead_assignment_owner_guard_v497() TO service_role;

REVOKE ALL ON FUNCTION public.psp_team_repair_my_clients_v362(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.psp_team_repair_my_clients_v362(text) TO anon,authenticated,service_role;
