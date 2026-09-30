-- PipSePaisa V357 — keep current Team owner and attribution manager consistent.
-- Canonical owner drives My Clients and also the manager used by Team metrics.

create or replace function public.psp_sync_team_attribution_from_owner_v357()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.user_id is not null and nullif(trim(coalesce(new.team_member_id,'')),'') is not null then
    update public.team_client_attribution_v206 a
       set team_member_id=new.team_member_id,
           updated_at=clock_timestamp()
     where a.user_id=new.user_id
       and a.team_member_id is distinct from new.team_member_id;
  end if;
  return new;
end;
$function$;

drop trigger if exists psp_sync_team_attribution_from_owner_v357_trg on public.psp_client_owner_v273;
create trigger psp_sync_team_attribution_from_owner_v357_trg
after insert or update of team_member_id,user_id
on public.psp_client_owner_v273
for each row execute function public.psp_sync_team_attribution_from_owner_v357();

create or replace function public.psp_keep_team_attribution_canonical_v357()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_owner text;
begin
  if new.user_id is not null then
    select o.team_member_id into v_owner
    from public.psp_client_owner_v273 o
    where o.user_id=new.user_id
    order by o.updated_at desc nulls last
    limit 1;

    if nullif(trim(coalesce(v_owner,'')),'') is not null then
      new.team_member_id:=v_owner;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists psp_keep_team_attribution_canonical_v357_trg on public.team_client_attribution_v206;
create trigger psp_keep_team_attribution_canonical_v357_trg
before insert or update of team_member_id,user_id
on public.team_client_attribution_v206
for each row execute function public.psp_keep_team_attribution_canonical_v357();

update public.team_client_attribution_v206 a
set team_member_id=o.team_member_id,
    updated_at=clock_timestamp()
from public.psp_client_owner_v273 o
where o.user_id=a.user_id
  and a.team_member_id is distinct from o.team_member_id;
