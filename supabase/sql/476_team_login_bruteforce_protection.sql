-- PipSePaisa V476 — Team Panel login brute-force protection.
-- Production-safe: preserves existing username/password/session behavior.

begin;

create table if not exists public.psp_team_login_rate_v476(
  username text primary key,
  fail_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.psp_team_login_rate_v476 enable row level security;
revoke all on table public.psp_team_login_rate_v476 from public, anon, authenticated;
grant select,insert,update,delete on table public.psp_team_login_rate_v476 to service_role;

create or replace function public.psp_team_login_v56(p_username text,p_password text)
returns table(session_token text,expires_at timestamptz,display_name text,username text)
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_team public.team_members%rowtype;
  v_token text;
  v_expires timestamptz := now() + interval '7 days';
  v_username text := lower(btrim(coalesce(p_username,'')));
  v_password text := coalesce(p_password,'');
  v_fail_count integer := 0;
  v_locked_until timestamptz;
begin
  if v_username='' or v_password='' then
    raise exception 'Username or password is incorrect.';
  end if;

  select r.locked_until into v_locked_until
  from public.psp_team_login_rate_v476 r
  where r.username=v_username;

  if v_locked_until is not null and v_locked_until>now() then
    raise exception 'Too many login attempts. Please try again later.';
  end if;

  select tm.* into v_team
  from public.team_members tm
  where lower(tm.username)=v_username
    and tm.is_active=true
    and tm.password_hash is not null
  limit 1;

  if not found or crypt(v_password,v_team.password_hash)<>v_team.password_hash then
    insert into public.psp_team_login_rate_v476(username,fail_count,window_started_at,locked_until,updated_at)
    values(v_username,1,now(),null,now())
    on conflict(username) do update set
      fail_count=case
        when public.psp_team_login_rate_v476.window_started_at < now()-interval '15 minutes' then 1
        else public.psp_team_login_rate_v476.fail_count+1
      end,
      window_started_at=case
        when public.psp_team_login_rate_v476.window_started_at < now()-interval '15 minutes' then now()
        else public.psp_team_login_rate_v476.window_started_at
      end,
      locked_until=case
        when public.psp_team_login_rate_v476.window_started_at < now()-interval '15 minutes' then null
        else public.psp_team_login_rate_v476.locked_until
      end,
      updated_at=now()
    returning fail_count into v_fail_count;

    if v_fail_count>=20 then
      update public.psp_team_login_rate_v476
      set locked_until=now()+interval '15 minutes',updated_at=now()
      where username=v_username;
    end if;

    raise exception 'Username or password is incorrect.';
  end if;

  delete from public.psp_team_login_rate_v476 where username=v_username;
  delete from public.psp_team_login_rate_v476 where updated_at<now()-interval '2 days';

  delete from public.team_login_sessions s
  where s.expires_at<=now()
     or (s.team_member_id=v_team.id and s.created_at<now()-interval '30 days');

  v_token:=encode(gen_random_bytes(32),'hex');

  insert into public.team_login_sessions(team_member_id,token_hash,expires_at)
  values(v_team.id,digest(v_token,'sha256'),v_expires);

  return query
  select v_token::text,v_expires,v_team.display_name::text,v_team.username::text;
end;
$function$;

commit;
