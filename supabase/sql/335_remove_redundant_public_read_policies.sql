
drop policy if exists "psp_v82_authenticated_read_published_articles" on public.articles;
drop policy if exists "psp_v82_authenticated_read_charts" on public.charts;
drop policy if exists "Everyone can view news impact cache" on public.nh_impact_cache;
