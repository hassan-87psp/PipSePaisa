-- PipSePaisa V485 — Team custom-login hardening.
-- Current Team Panel uses psp_team_login_v56 directly, so the old username->email
-- resolver is no longer public. Reduce brute-force lockout threshold to 10.

begin;

revoke all on function public.psp_team_resolve_login(text) from public,anon,authenticated;
grant execute on function public.psp_team_resolve_login(text) to service_role;

do $$
declare v_def text;
begin
  select pg_get_functiondef('public.psp_team_login_v56(text,text)'::regprocedure) into v_def;
  if position('if v_fail_count>=20 then' in v_def)=0 then
    raise exception 'Team login lockout patch target not found';
  end if;
  v_def:=replace(v_def,'if v_fail_count>=20 then','if v_fail_count>=10 then');
  execute v_def;
end $$;

commit;
