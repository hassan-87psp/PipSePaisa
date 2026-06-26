-- ============================================
-- PipSePaisa — Social Media Banners
-- Admin uploads banners, all users can view/download
-- ============================================

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  created_at timestamptz default now()
);

alter table public.banners enable row level security;

-- Everyone (logged in) can read banners
drop policy if exists banners_read on public.banners;
create policy banners_read on public.banners
  for select using (true);

-- Only admin can add banners
drop policy if exists banners_ins on public.banners;
create policy banners_ins on public.banners
  for insert with check (public.is_admin());

-- Only admin can delete banners
drop policy if exists banners_del on public.banners;
create policy banners_del on public.banners
  for delete using (public.is_admin());

-- seed site_settings tab toggle (so admin can show/hide the tab)
insert into public.site_settings(key, enabled) values ('banners', true)
  on conflict (key) do nothing;
