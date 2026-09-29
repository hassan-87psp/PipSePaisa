-- PipSePaisa V318
-- All psp_admin_* SECURITY DEFINER RPCs already enforce admin authorization.
-- Remove anonymous execution while preserving signed-in admin and service-role access.

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.prosecdef
      and p.prokind in ('f','p')
      and p.proname like 'psp_admin_%'
  loop
    execute format('revoke execute on function %s from public, anon', r.fn);
    execute format('grant execute on function %s to authenticated, service_role', r.fn);
  end loop;
end
$$;
