-- ============================================================
--  PipSePaisa — Site Tabs ON/OFF (admin controlled, global)
--  Run once in Supabase SQL editor.
-- ============================================================

create table if not exists public.site_settings (
  key        text primary key,
  enabled    boolean default true,
  updated_at timestamptz default now()
);

alter table public.site_settings enable row level security;

-- Everyone (even logged-out) can READ which tabs are on/off
drop policy if exists ss_read on public.site_settings;
create policy ss_read on public.site_settings
  for select using (true);

-- Only admin can change
drop policy if exists ss_write on public.site_settings;
create policy ss_write on public.site_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed all user-site tabs as enabled (safe to re-run)
insert into public.site_settings(key, enabled) values
  ('performance',true),('dashboard',true),('addtrade',true),('trades',true),('analysis',true),('aireport',true),
  ('charts',true),('chats',true),('signals',true),('articles',true),
  ('vipplans',true),('news',true),('newshub',true),('strength',true),
  ('tools',true),('learn',true),('vipindicators',true),('vipea',true),('settings',true),('about',true),
  ('announce',true),('support',true)
on conflict (key) do nothing;
