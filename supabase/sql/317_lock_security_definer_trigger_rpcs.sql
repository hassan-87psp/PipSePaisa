-- PipSePaisa V317
-- SECURITY DEFINER trigger functions are internal trigger entrypoints, not public RPCs.
-- Revoke direct invocation from client roles while existing triggers continue to fire.

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
      and p.prorettype='trigger'::regtype
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.fn);
  end loop;
end
$$;
