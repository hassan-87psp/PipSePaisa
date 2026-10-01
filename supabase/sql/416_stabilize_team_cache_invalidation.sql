
create or replace function public.psp_team_cache_invalidate_recent_v399()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_current date:=date_trunc('month',(now() at time zone 'Asia/Kuala_Lumpur')::date)::date;
begin
  delete from public.team_history_cache_v385
  where period_month>=((v_current-interval '2 months')::date)
    and computed_at < clock_timestamp()-interval '60 seconds';
  return null;
end;
$$;

create or replace function public.psp_team_daily_cache_invalidate_recent_v403()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  today_my date:=(now() at time zone 'Asia/Kuala_Lumpur')::date;
begin
  delete from public.team_daily_auto_cache_v403
  where report_date>=today_my-31
    and computed_at < clock_timestamp()-interval '60 seconds';
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
  delete from public.team_range_cache_v404
  where computed_at < clock_timestamp()-interval '60 seconds';
  return null;
end;
$$;

create or replace function public.psp_team_range_cache_invalidate_all_v416()
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

drop trigger if exists psp_team_range_cache_v404 on public.psp_client_manager_override_v281;
create trigger psp_team_range_cache_v404
after insert or update or delete on public.psp_client_manager_override_v281
for each statement execute function public.psp_team_range_cache_invalidate_all_v416();

drop trigger if exists psp_team_range_cache_v404 on public.tracked_link_events;
drop trigger if exists psp_team_range_cache_v404 on public.psp_ad_submissions_v259;
drop trigger if exists psp_team_range_cache_v404 on public.psp_lead_assignments;
drop trigger if exists psp_team_range_cache_v404 on public.course_payments;
drop trigger if exists psp_team_range_cache_v404 on public.team_performance_monthly_v206;
