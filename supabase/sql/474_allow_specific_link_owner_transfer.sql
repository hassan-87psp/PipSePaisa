create or replace function public.psp_team_owner_person_guard_v362()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_name text;
  v_phone text;
  v_existing_owner text;
  v_has_override boolean:=false;
  v_has_specific_link boolean:=false;
begin
  v_name:=lower(regexp_replace(trim(coalesce(new.full_name,'')),'\s+',' ','g'));
  v_phone:=regexp_replace(coalesce(new.whatsapp,''),'[^0-9]','','g');

  if new.user_id is not null then
    select exists(
      select 1 from public.psp_client_manager_override_v281 ov
      where ov.user_id=new.user_id and ov.team_member_id=new.team_member_id
    ) into v_has_override;

    select exists(
      select 1
      from public.team_client_attribution_v206 a
      join public.tracked_links tl on tl.id::text=a.link_id::text
      where a.user_id=new.user_id
        and a.team_member_id=new.team_member_id
        and tl.assigned_team_member_id::text=new.team_member_id
        and coalesce(tl.is_active,true)=true
    ) into v_has_specific_link;
  end if;

  if tg_op='UPDATE' and old.team_member_id is distinct from new.team_member_id then
    if v_has_override
       or v_has_specific_link
       or lower(coalesce(new.source,'')) ~ '(admin[ _-]*transfer|admin[ _-]*override|manager[ _-]*transfer|manual[ _-]*transfer)'
    then
      return new;
    end if;

    new.team_member_id:=old.team_member_id;
    return new;
  end if;

  if v_has_specific_link then return new; end if;

  if length(v_phone)>=7 and nullif(v_name,'') is not null then
    select o.team_member_id into v_existing_owner
    from public.psp_client_owner_v273 o
    where o.client_key is distinct from new.client_key
      and lower(regexp_replace(trim(coalesce(o.full_name,'')),'\s+',' ','g'))=v_name
      and regexp_replace(coalesce(o.whatsapp,''),'[^0-9]','','g')=v_phone
    order by coalesce(o.assigned_at,o.updated_at) asc,o.updated_at asc
    limit 1;

    if nullif(trim(coalesce(v_existing_owner,'')),'') is not null then
      new.team_member_id:=v_existing_owner;
    end if;
  end if;

  return new;
end;
$function$;

create or replace function public.psp_sync_team_attribution_from_owner_v357()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.user_id is not null
     and nullif(trim(coalesce(new.team_member_id,'')),'') is not null then
    update public.team_client_attribution_v206 a
       set team_member_id=new.team_member_id,
           updated_at=clock_timestamp()
     where a.user_id=new.user_id
       and a.team_member_id is distinct from new.team_member_id
       and (
         exists(
           select 1 from public.psp_client_manager_override_v281 ov
           where ov.user_id=new.user_id and ov.team_member_id=new.team_member_id
         )
         or not exists(
           select 1 from public.tracked_links tl
           where tl.id::text=a.link_id::text
             and coalesce(tl.is_active,true)=true
             and nullif(trim(coalesce(tl.assigned_team_member_id::text,'')),'') is not null
         )
         or exists(
           select 1 from public.tracked_links tl
           where tl.id::text=a.link_id::text
             and coalesce(tl.is_active,true)=true
             and tl.assigned_team_member_id::text=new.team_member_id
         )
       );
  end if;
  return new;
end;
$function$;
