-- Forex Impact AI cache (sab users ke liye shared) — SQL Editor me RUN karo
create table if not exists public.nh_impact_cache (
  id int primary key,
  data jsonb,
  updated_at timestamptz default now()
);

alter table public.nh_impact_cache enable row level security;

drop policy if exists "impact read all" on public.nh_impact_cache;
create policy "impact read all" on public.nh_impact_cache
  for select using (true);

drop policy if exists "impact write authed" on public.nh_impact_cache;
create policy "impact write authed" on public.nh_impact_cache
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into public.nh_impact_cache (id, data) values (1, null)
on conflict (id) do nothing;
