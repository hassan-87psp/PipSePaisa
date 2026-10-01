-- PipSePaisa V385 — cached Team History to avoid PostgREST statement timeouts.
-- Applied to production 2026-10-01.

create table if not exists public.team_history_cache_v385(
  team_member_id text not null,
  period_month date not null,
  snapshot jsonb not null,
  computed_at timestamptz not null default clock_timestamp(),
  primary key(team_member_id,period_month)
);

create index if not exists team_history_cache_v385_period_idx
  on public.team_history_cache_v385(period_month desc);

revoke all on public.team_history_cache_v385 from anon,authenticated;

create or replace function public.psp_team_history_v385(
  p_session_token text,
  p_months integer default 6,
  p_month integer default null,
  p_year integer default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_team text:=public.psp_team_member_id_from_session_v245(p_session_token);
  v_now date:=(now() at time zone 'Asia/Kuala_Lumpur')::date;
  v_m integer:=coalesce(p_month,extract(month from v_now)::integer);
  v_y integer:=coalesce(p_year,extract(year from v_now)::integer);
  v_n integer:=greatest(1,least(coalesce(p_months,6),24));
  v_anchor date;
  v_d date;
  v_d2 date;
  v_i integer;
  v_arr jsonb:='[]'::jsonb;
  v_one jsonb;
begin
  if v_team is null then raise exception 'Team session is invalid or expired.'; end if;
  if v_m<1 or v_m>12 or v_y<2020 or v_y>2100 then raise exception 'Invalid month/year.'; end if;

  v_anchor:=make_date(v_y,v_m,1);

  for v_i in 0..v_n-1 loop
    v_d:=(v_anchor-(v_i||' months')::interval)::date;
    v_d2:=(v_d+interval '1 month')::date;

    select c.snapshot into v_one
    from public.team_history_cache_v385 c
    where c.team_member_id=v_team and c.period_month=v_d;

    if v_one is null then
      v_one:=public.psp_team_metrics_core_v207(v_team,v_d)
             || public.psp_team_client_cohort_stats_v209(v_team,v_d,v_d2);

      insert into public.team_history_cache_v385(team_member_id,period_month,snapshot,computed_at)
      values(v_team,v_d,v_one,clock_timestamp())
      on conflict(team_member_id,period_month) do update
        set snapshot=excluded.snapshot,computed_at=excluded.computed_at;
    end if;

    v_arr:=v_arr||jsonb_build_array(v_one);
  end loop;

  return v_arr;
end;
$function$;

grant execute on function public.psp_team_history_v385(text,integer,integer,integer) to anon,authenticated;

-- Historical months should be seeded once after deployment. The production rollout
-- populated Apr-Sep 2026 for every active Team Member.
