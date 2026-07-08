-- ============================================================
-- Mentor charts/articles/banners USERS ko dikhen — RLS read policies
-- SQL Editor me POORA paste karke RUN karo
-- ============================================================

-- CHARTS: sab logged-in users parh saken
alter table public.charts enable row level security;
drop policy if exists "charts read all" on public.charts;
create policy "charts read all" on public.charts
  for select using (true);

-- ARTICLES: published sab parh saken
alter table public.articles enable row level security;
drop policy if exists "articles read all" on public.articles;
create policy "articles read all" on public.articles
  for select using (true);

-- BANNERS: sab parh saken
alter table public.banners enable row level security;
drop policy if exists "banners read all" on public.banners;
create policy "banners read all" on public.banners
  for select using (true);

-- SIGNALS: sab parh saken (pehle se chal raha hoga, ehtiyatan)
alter table public.signals enable row level security;
drop policy if exists "signals read all" on public.signals;
create policy "signals read all" on public.signals
  for select using (true);
