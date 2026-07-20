-- ============================================================
-- Breakeven system + Realtime — POORA paste karke RUN karo
-- ============================================================

-- 1) be_moved column (SL moved to breakeven tag)
alter table public.signals add column if not exists be_moved boolean default false;

-- 2) UPDATE trigger: status change YA be_moved change pe function call
create or replace function public.fn_notify_signal_update()
returns trigger language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if (coalesce(NEW.status,'') is distinct from coalesce(OLD.status,''))
     or (coalesce(NEW.be_moved,false) is distinct from coalesce(OLD.be_moved,false)) then
    perform net.http_post(
      url     := 'https://vjqvoinsspgsrcyhwspy.supabase.co/functions/v1/notify-signal',
      headers := jsonb_build_object('Content-Type','application/json'),
      body    := jsonb_build_object(
                   'type', 'UPDATE',
                   'table', TG_TABLE_NAME,
                   'record', to_jsonb(NEW),
                   'old_record', to_jsonb(OLD))
    );
  end if;
  return NEW;
end $$;

drop trigger if exists trg_notify_signal_upd on public.signals;
create trigger trg_notify_signal_upd after update on public.signals
for each row execute function public.fn_notify_signal_update();

-- 3) Realtime: signals/charts/articles/banners instant updates ke liye
do $$
begin
  begin
    alter publication supabase_realtime add table public.signals;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.charts;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.articles;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.banners;
  exception when duplicate_object then null; end;
end $$;
