-- V412 fix cache invalidation triggers blocked by DELETE-without-WHERE guard

create or replace function public.psp_team_cache_invalidate_all_v399()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  delete from public.team_history_cache_v385 where true;
  return null;
end;
$$;

create or replace function public.psp_team_daily_cache_invalidate_all_v403()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  delete from public.team_daily_auto_cache_v403 where true;
  return null;
end;
$$;

create or replace function public.psp_team_range_cache_invalidate_v404()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  delete from public.team_range_cache_v404 where true;
  return null;
end;
$$;
