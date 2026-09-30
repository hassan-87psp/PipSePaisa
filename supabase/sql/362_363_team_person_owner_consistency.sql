-- PipSePaisa V362/V363 — canonical person-level Team ownership.
-- Final production state: duplicate signups stay with the existing owner; explicit Admin/Manager
-- transfers propagate to exact duplicate accounts; stale Round Robin/Ad updates cannot steal a client.
-- Applied to production on 2026-09-30.

CREATE OR REPLACE FUNCTION public.psp_team_override_owner_sync_v362()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update public.psp_client_owner_v273 o
     set team_member_id=new.team_member_id,
         source='Admin Override',
         updated_at=clock_timestamp()
   where o.user_id=new.user_id
     and o.team_member_id is distinct from new.team_member_id;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_owner_person_guard_v362()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_name text;
  v_phone text;
  v_existing_owner text;
  v_has_override boolean:=false;
begin
  v_name:=lower(regexp_replace(trim(coalesce(new.full_name,'')),'\s+',' ','g'));
  v_phone:=regexp_replace(coalesce(new.whatsapp,''),'[^0-9]','','g');

  if tg_op='UPDATE' and old.team_member_id is distinct from new.team_member_id then
    if new.user_id is not null then
      select exists(
        select 1 from public.psp_client_manager_override_v281 ov
        where ov.user_id=new.user_id and ov.team_member_id=new.team_member_id
      ) into v_has_override;
    end if;

    if v_has_override
       or lower(coalesce(new.source,'')) ~ '(admin[ _-]*transfer|admin[ _-]*override|manager[ _-]*transfer|manual[ _-]*transfer)'
    then
      return new;
    end if;

    -- Round Robin, Ad Link and background syncs cannot steal an existing client.
    new.team_member_id:=old.team_member_id;
    return new;
  end if;

  if length(v_phone)>=7 and nullif(v_name,'') is not null then
    select o.team_member_id
      into v_existing_owner
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

CREATE OR REPLACE FUNCTION public.psp_team_owner_person_propagate_v362()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_name text;
  v_phone text;
  v_transfer_source text;
begin
  if pg_trigger_depth()>1 then return new; end if;
  if old.team_member_id is not distinct from new.team_member_id then return new; end if;

  v_name:=lower(regexp_replace(trim(coalesce(new.full_name,'')),'\s+',' ','g'));
  v_phone:=regexp_replace(coalesce(new.whatsapp,''),'[^0-9]','','g');
  v_transfer_source:=case
    when lower(coalesce(new.source,'')) like '%override%' then 'Admin Override'
    else 'Admin Transfer'
  end;

  if length(v_phone)>=7 and nullif(v_name,'') is not null then
    update public.psp_client_owner_v273 o
       set team_member_id=new.team_member_id,
           source=v_transfer_source,
           updated_at=clock_timestamp()
     where o.client_key<>new.client_key
       and lower(regexp_replace(trim(coalesce(o.full_name,'')),'\s+',' ','g'))=v_name
       and regexp_replace(coalesce(o.whatsapp,''),'[^0-9]','','g')=v_phone
       and o.team_member_id is distinct from new.team_member_id;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_team_repair_my_clients_v362(p_session_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_member_id text;
  v_inserted integer:=0;
  v_total bigint:=0;
begin
  v_member_id:=public.psp_team_member_id_from_session_v245(p_session_token);
  if v_member_id is null then raise exception 'Team session is invalid or expired.'; end if;

  with latest_assignment as (
    select distinct on(a.user_id)
      a.user_id,a.team_member_id,a.client_name,a.client_email,a.client_whatsapp,a.assigned_at,a.created_at,a.id
    from public.psp_lead_assignments a
    where a.user_id is not null
    order by a.user_id,a.assigned_at desc,a.created_at desc,a.id desc
  ),
  latest_ad as (
    select distinct on(s.user_id)
      s.user_id,s.team_member_id,s.client_id,s.full_name,s.email,s.whatsapp,s.created_at,s.id
    from public.psp_ad_submissions_v259 s
    where s.user_id is not null
    order by s.user_id,s.created_at desc,s.id desc
  ),
  latest_attr as (
    select distinct on(a.user_id)
      a.user_id,a.team_member_id,a.attributed_at,a.source
    from public.team_client_attribution_v206 a
    where a.user_id is not null
    order by a.user_id,a.attributed_at desc,a.updated_at desc nulls last
  ),
  missing as (
    select u.user_id
    from (
      select user_id from latest_assignment
      union select user_id from latest_ad
      union select user_id from latest_attr
    ) u
    left join public.psp_client_owner_v273 o on o.user_id=u.user_id
    where o.user_id is null
  ),
  candidate as (
    select
      m.user_id,
      coalesce(ov.team_member_id,la.team_member_id,ad.team_member_id,at.team_member_id)::text as desired_team_member_id,
      coalesce(p.client_id,ad.client_id,'')::text as client_id,
      coalesce(nullif(la.client_name,''),nullif(ad.full_name,''),nullif(p.full_name,''),
               split_part(coalesce(nullif(la.client_email,''),nullif(ad.email,''),p.email,''),'@',1),'Client')::text as full_name,
      lower(trim(coalesce(nullif(la.client_email,''),nullif(ad.email,''),p.email,'')))::text as email,
      regexp_replace(coalesce(nullif(la.client_whatsapp,''),nullif(ad.whatsapp,''),p.whatsapp,p.phone,''),'[^0-9+]','','g')::text as whatsapp,
      coalesce(la.assigned_at,ad.created_at,at.attributed_at,p.created_at,clock_timestamp()) as assigned_at,
      case
        when ov.team_member_id is not null then 'Admin Override'
        when la.team_member_id is not null then 'Round Robin'
        when ad.team_member_id is not null then 'Ad Link'
        else coalesce(nullif(at.source,''),'Tracked Link')
      end::text as source
    from missing m
    left join public.profiles p on p.id=m.user_id
    left join public.psp_client_manager_override_v281 ov on ov.user_id=m.user_id
    left join latest_assignment la on la.user_id=m.user_id
    left join latest_ad ad on ad.user_id=m.user_id
    left join latest_attr at on at.user_id=m.user_id
  )
  insert into public.psp_client_owner_v273(
    client_key,user_id,client_id,full_name,email,whatsapp,team_member_id,source,assigned_at,updated_at
  )
  select
    public.psp_client_key_v273(c.user_id,c.email,c.whatsapp,c.client_id),
    c.user_id,c.client_id,c.full_name,c.email,c.whatsapp,c.desired_team_member_id,c.source,c.assigned_at,clock_timestamp()
  from candidate c
  where c.desired_team_member_id=v_member_id
    and public.psp_client_key_v273(c.user_id,c.email,c.whatsapp,c.client_id) is not null
  on conflict(client_key) do nothing;

  get diagnostics v_inserted=row_count;

  select count(*) into v_total
  from public.psp_client_owner_v273 o
  where o.team_member_id=v_member_id;

  return jsonb_build_object(
    'ok',true,
    'team_member_id',v_member_id,
    'inserted_missing',v_inserted,
    'owner_count',coalesce(v_total,0),
    'total_count',coalesce(v_total,0)
  );
end;
$function$;

drop trigger if exists psp_team_owner_person_guard_v362_trg on public.psp_client_owner_v273;
create trigger psp_team_owner_person_guard_v362_trg
before insert or update of full_name,whatsapp,team_member_id
on public.psp_client_owner_v273
for each row execute function public.psp_team_owner_person_guard_v362();

drop trigger if exists psp_team_owner_person_propagate_v362_trg on public.psp_client_owner_v273;
create trigger psp_team_owner_person_propagate_v362_trg
after update of team_member_id
on public.psp_client_owner_v273
for each row execute function public.psp_team_owner_person_propagate_v362();

drop trigger if exists psp_team_override_owner_sync_v362_trg on public.psp_client_manager_override_v281;
create trigger psp_team_override_owner_sync_v362_trg
after insert or update of team_member_id
on public.psp_client_manager_override_v281
for each row execute function public.psp_team_override_owner_sync_v362();

grant execute on function public.psp_team_repair_my_clients_v362(text) to anon,authenticated;

-- One-time duplicate-person repair: preserve earliest owner where no explicit override exists.
with base as (
  select
    o.client_key,o.user_id,o.team_member_id,
    lower(regexp_replace(trim(coalesce(o.full_name,'')),'\s+',' ','g')) as name_norm,
    regexp_replace(coalesce(o.whatsapp,''),'[^0-9]','','g') as phone_norm,
    coalesce(o.assigned_at,o.updated_at) as first_seen,
    exists(select 1 from public.psp_client_manager_override_v281 ov where ov.user_id=o.user_id) as has_override
  from public.psp_client_owner_v273 o
  where length(regexp_replace(coalesce(o.whatsapp,''),'[^0-9]','','g'))>=7
    and nullif(lower(regexp_replace(trim(coalesce(o.full_name,'')),'\s+',' ','g')),'') is not null
), groups as (
  select phone_norm,name_norm
  from base
  group by phone_norm,name_norm
  having count(*)>1 and count(distinct team_member_id)>1 and bool_or(has_override)=false
), winner as (
  select distinct on(b.phone_norm,b.name_norm)
    b.phone_norm,b.name_norm,b.team_member_id as canonical_team_member_id
  from base b join groups g using(phone_norm,name_norm)
  order by b.phone_norm,b.name_norm,b.first_seen asc,b.client_key
)
update public.psp_client_owner_v273 o
set team_member_id=w.canonical_team_member_id,updated_at=clock_timestamp()
from winner w
where regexp_replace(coalesce(o.whatsapp,''),'[^0-9]','','g')=w.phone_norm
  and lower(regexp_replace(trim(coalesce(o.full_name,'')),'\s+',' ','g'))=w.name_norm
  and o.team_member_id is distinct from w.canonical_team_member_id;

-- Align only the latest routing records with the canonical owner; older history remains untouched.
with latest as (
  select distinct on(a.user_id) a.id,a.user_id
  from public.psp_lead_assignments a
  where a.user_id is not null
  order by a.user_id,a.assigned_at desc,a.created_at desc,a.id desc
)
update public.psp_lead_assignments a
set team_member_id=o.team_member_id,
    team_member_name=coalesce(tm.display_name,tm.username,a.team_member_name),
    team_member_whatsapp=coalesce(tm.whatsapp_number,a.team_member_whatsapp)
from latest l
join public.psp_client_owner_v273 o on o.user_id=l.user_id
left join public.team_members tm on tm.id::text=o.team_member_id
where a.id=l.id and a.team_member_id is distinct from o.team_member_id;

with latest as (
  select distinct on(s.user_id) s.id,s.user_id
  from public.psp_ad_submissions_v259 s
  where s.user_id is not null
  order by s.user_id,s.created_at desc,s.id desc
)
update public.psp_ad_submissions_v259 s
set team_member_id=o.team_member_id,
    team_member_name=coalesce(tm.display_name,tm.username,s.team_member_name),
    team_member_whatsapp=coalesce(tm.whatsapp_number,s.team_member_whatsapp)
from latest l
join public.psp_client_owner_v273 o on o.user_id=l.user_id
left join public.team_members tm on tm.id::text=o.team_member_id
where s.id=l.id and s.team_member_id is distinct from o.team_member_id;
