-- ============================================================
-- PIPSEPAISA QUERY 49
-- SIGNAL PUSH NOTIFICATION WEBHOOK
-- Run after deploying the notify-signal Edge Function.
-- ============================================================

create extension if not exists pg_net;

-- Ensure realtime remains enabled for in-panel notifications.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='signals'
  ) then
    alter publication supabase_realtime add table public.signals;
  end if;
end $$;

create or replace function public.psp_notify_new_signal()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  request_id bigint;
begin
  select net.http_post(
    url := 'https://vjqvoinsspgsrcyhwspy.supabase.co/functions/v1/notify-signal',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-hook-secret', current_setting('app.settings.psp_hook_secret', true)
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'signals',
      'schema', 'public',
      'record', to_jsonb(new)
    )
  ) into request_id;

  return new;
end;
$$;

drop trigger if exists psp_signal_push_trigger on public.signals;

create trigger psp_signal_push_trigger
after insert on public.signals
for each row
execute function public.psp_notify_new_signal();

notify pgrst, 'reload schema';

select
  '✅ TRIGGER INSTALLED' as status,
  'Set database parameter app.settings.psp_hook_secret to the same HOOK_SECRET used in the Edge Function.' as next_step;
