-- ============================================================
-- PipSePaisa — Push notification triggers (poora paste karke RUN karo)
-- INSERT: signals, charts, articles, banners
-- UPDATE: signals (TP1/TP2/TP3/SL/closed)
-- ============================================================

create extension if not exists pg_net with schema extensions;

-- INSERT wala function (naya row => push)
create or replace function public.fn_notify_signal()
returns trigger language plpgsql security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url     := 'https://vjqvoinsspgsrcyhwspy.supabase.co/functions/v1/notify-signal',
    headers := jsonb_build_object('Content-Type','application/json'),
    body    := jsonb_build_object(
                 'type', 'INSERT',
                 'table', TG_TABLE_NAME,
                 'record', to_jsonb(NEW))
  );
  return NEW;
end $$;

-- UPDATE wala function (status change => push, old_record bhi bhejta hai)
create or replace function public.fn_notify_signal_update()
returns trigger language plpgsql security definer
set search_path = public, extensions
as $$
begin
  -- sirf tab bhejo jab status change hua ho
  if coalesce(NEW.status,'') is distinct from coalesce(OLD.status,'') then
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

-- INSERT triggers (sab tables)
drop trigger if exists trg_notify_signal on public.signals;
create trigger trg_notify_signal after insert on public.signals
for each row execute function public.fn_notify_signal();

drop trigger if exists trg_notify_chart on public.charts;
create trigger trg_notify_chart after insert on public.charts
for each row execute function public.fn_notify_signal();

drop trigger if exists trg_notify_article on public.articles;
create trigger trg_notify_article after insert on public.articles
for each row execute function public.fn_notify_signal();

drop trigger if exists trg_notify_banner on public.banners;
create trigger trg_notify_banner after insert on public.banners
for each row execute function public.fn_notify_signal();

-- UPDATE trigger (sirf signals — TP/SL/close ke liye)
drop trigger if exists trg_notify_signal_upd on public.signals;
create trigger trg_notify_signal_upd after update on public.signals
for each row execute function public.fn_notify_signal_update();
