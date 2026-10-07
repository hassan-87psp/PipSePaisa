-- PipSePaisa V493 — fix Team Panel login regression.
-- The RETURNS TABLE output field "username" conflicted with the
-- psp_team_login_rate_v476.username column inside PL/pgSQL.
-- Applied to production 2026-10-07.

CREATE OR REPLACE FUNCTION public.psp_team_login_v56(p_username text, p_password text)
RETURNS TABLE(session_token text, expires_at timestamptz, display_name text, username text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
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
  from public.psp_team_login_rate_v476 as r
  where r.username = v_username;

  if v_locked_until is not null and v_locked_until > now() then
    raise exception 'Too many login attempts. Please try again later.';
  end if;

  select tm.* into v_team
  from public.team_members as tm
  where lower(tm.username) = v_username
    and tm.is_active = true
    and tm.password_hash is not null
  limit 1;

  if not found or crypt(v_password, v_team.password_hash) <> v_team.password_hash then
    insert into public.psp_team_login_rate_v476 as rate_row(
      username, fail_count, window_started_at, locked_until, updated_at
    ) values (
      v_username, 1, now(), null, now()
    )
    on conflict on constraint psp_team_login_rate_v476_pkey do update set
      fail_count = case
        when rate_row.window_started_at < now() - interval '15 minutes' then 1
        else rate_row.fail_count + 1
      end,
      window_started_at = case
        when rate_row.window_started_at < now() - interval '15 minutes' then now()
        else rate_row.window_started_at
      end,
      locked_until = case
        when rate_row.window_started_at < now() - interval '15 minutes' then null
        else rate_row.locked_until
      end,
      updated_at = now()
    returning rate_row.fail_count into v_fail_count;

    if v_fail_count >= 10 then
      update public.psp_team_login_rate_v476 as r
      set locked_until = now() + interval '15 minutes',
          updated_at = now()
      where r.username = v_username;
    end if;

    raise exception 'Username or password is incorrect.';
  end if;

  delete from public.psp_team_login_rate_v476 as r
  where r.username = v_username;

  delete from public.psp_team_login_rate_v476 as r
  where r.updated_at < now() - interval '2 days';

  delete from public.team_login_sessions as s
  where s.expires_at <= now()
     or (s.team_member_id = v_team.id and s.created_at < now() - interval '30 days');

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.team_login_sessions(team_member_id,token_hash,expires_at)
  values(v_team.id,digest(v_token,'sha256'),v_expires);

  return query
  select v_token::text,v_expires,v_team.display_name::text,v_team.username::text;
end;
$function$;
