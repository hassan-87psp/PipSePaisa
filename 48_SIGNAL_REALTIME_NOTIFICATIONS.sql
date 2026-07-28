-- PIPSEPAISA QUERY 48 — SIGNAL REALTIME NOTIFICATIONS
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='signals'
  ) then
    alter publication supabase_realtime add table public.signals;
  end if;
end $$;

notify pgrst, 'reload schema';

select case when exists (
  select 1 from pg_publication_tables
  where pubname='supabase_realtime'
    and schemaname='public'
    and tablename='signals'
) then '✅ SIGNAL REALTIME ENABLED'
else '❌ SIGNAL REALTIME NOT ENABLED' end as status;
