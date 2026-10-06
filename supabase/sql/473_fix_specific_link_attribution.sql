create or replace function public.psp_keep_team_attribution_canonical_v357()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_override text;
  v_link_owner text;
  v_existing_owner text;
begin
  if new.user_id is null then return new; end if;

  select o.team_member_id into v_override
  from public.psp_client_manager_override_v281 o
  where o.user_id=new.user_id
  limit 1;

  if nullif(trim(coalesce(v_override,'')),'') is not null then
    new.team_member_id:=v_override;
    return new;
  end if;

  if new.link_id is not null then
    select tl.assigned_team_member_id::text into v_link_owner
    from public.tracked_links tl
    where tl.id::text=new.link_id::text
      and coalesce(tl.is_active,true)=true
      and nullif(trim(coalesce(tl.assigned_team_member_id::text,'')),'') is not null
    limit 1;
  end if;

  if nullif(trim(coalesce(v_link_owner,'')),'') is not null then
    new.team_member_id:=v_link_owner;
    return new;
  end if;

  select o.team_member_id into v_existing_owner
  from public.psp_client_owner_v273 o
  where o.user_id=new.user_id
  order by o.updated_at desc nulls last
  limit 1;

  if nullif(trim(coalesce(v_existing_owner,'')),'') is not null then
    new.team_member_id:=v_existing_owner;
  end if;
  return new;
end;
$function$;

create or replace function public.psp_capture_team_attribution_v206()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner text;
  v_link jsonb;
begin
  if new.user_id is null or new.link_id is null then return new; end if;

  v_owner:=public.psp_team_owner_for_link_v206(new.link_id::text);
  if v_owner is null then return new; end if;

  select to_jsonb(tl) into v_link
  from public.tracked_links tl
  where tl.id::text=new.link_id::text
  limit 1;

  insert into public.team_client_attribution_v206(
    user_id,team_member_id,link_id,source,campaign,reference_code,attributed_at,updated_at
  ) values (
    new.user_id,v_owner,new.link_id::text,
    nullif(v_link->>'source',''),
    nullif(v_link->>'campaign',''),
    coalesce(nullif(v_link->>'slug',''),nullif(v_link->>'reference_code','')),
    coalesce(new.created_at,now()),now()
  )
  on conflict(user_id) do update set
    team_member_id=excluded.team_member_id,
    link_id=excluded.link_id,
    source=excluded.source,
    campaign=excluded.campaign,
    reference_code=excluded.reference_code,
    attributed_at=excluded.attributed_at,
    updated_at=now()
  where excluded.attributed_at>=public.team_client_attribution_v206.attributed_at;

  return new;
end;
$function$;

create or replace function public.psp_link_team_for_user_v281(p_user_id uuid)
returns table(team_member_id text,team_member_name text,whatsapp_number text,link_id text)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_member_id text;
  v_link_id text;
  v_name text;
  v_wa text;
begin
  if p_user_id is null then return; end if;

  begin
    select tl.assigned_team_member_id::text,tl.id::text
    into v_member_id,v_link_id
    from public.team_client_attribution_v206 a
    join public.tracked_links tl on tl.id::text=a.link_id::text
    where a.user_id=p_user_id
      and nullif(trim(coalesce(tl.assigned_team_member_id::text,'')),'') is not null
      and coalesce(tl.is_active,true)=true
    order by a.attributed_at desc nulls last,a.updated_at desc nulls last
    limit 1;
  exception when others then
    v_member_id:=null; v_link_id:=null;
  end;

  if v_member_id is null then
    begin
      select tl.assigned_team_member_id::text,tl.id::text
      into v_member_id,v_link_id
      from public.tracked_link_events e
      join public.tracked_links tl on tl.id::text=e.link_id::text
      where e.user_id=p_user_id
        and nullif(trim(coalesce(tl.assigned_team_member_id::text,'')),'') is not null
        and coalesce(tl.is_active,true)=true
      order by e.created_at desc nulls last
      limit 1;
    exception when others then
      v_member_id:=null; v_link_id:=null;
    end;
  end if;

  if nullif(trim(coalesce(v_member_id,'')),'') is null then return; end if;

  select
    coalesce(nullif(trim(t.display_name),''),nullif(trim(t.username),''),'PipSePaisa Team'),
    regexp_replace(coalesce(t.whatsapp_number,''),'[^0-9]','','g')
  into v_name,v_wa
  from public.team_members t
  where t.id::text=v_member_id
    and coalesce(t.is_active,true)=true
  limit 1;

  if v_name is null or length(coalesce(v_wa,''))<8 then return; end if;
  return query select v_member_id,v_name,v_wa,v_link_id;
end;
$function$;
