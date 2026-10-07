-- PipSePaisa V484 — protect secret access PINs from the browser and throttle guesses.
-- The UI uses psp_get_my_access_status() and psp_activate_my_access_pin();
-- normal users no longer need SELECT access to user_access_pins.

begin;

create table if not exists public.psp_pin_attempt_rate_v484(
  user_id uuid primary key,
  fail_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.psp_pin_attempt_rate_v484 enable row level security;
revoke all on table public.psp_pin_attempt_rate_v484 from public,anon,authenticated;
grant select,insert,update,delete on table public.psp_pin_attempt_rate_v484 to service_role;

drop policy if exists "Users read own PIN status" on public.user_access_pins;
drop policy if exists "Admins read PIN records" on public.user_access_pins;
create policy "Admins read PIN records"
on public.user_access_pins for select to authenticated
using (public.psp_is_admin());

create or replace function public.psp_activate_my_access_pin(p_pin text)
returns table(success boolean,message text)
language plpgsql security definer set search_path to ''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_row public.user_access_pins%rowtype;
  v_fail_count integer:=0;
  v_window_started timestamptz;
  v_locked_until timestamptz;
begin
  if v_uid is null then return query select false,'Please sign in first.'; return; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text,484));

  select r.fail_count,r.window_started_at,r.locked_until
    into v_fail_count,v_window_started,v_locked_until
  from public.psp_pin_attempt_rate_v484 r where r.user_id=v_uid;

  if v_locked_until is not null and v_locked_until>now() then
    return query select false,'Too many incorrect PIN attempts. Please wait 15 minutes and try again.';
    return;
  end if;

  select * into v_row from public.user_access_pins where user_id=v_uid for update;
  if v_row.user_id is null then
    return query select false,'PIN record was not found. Please contact the admin.'; return;
  end if;

  update public.user_access_pins
  set last_pin_attempt_at=now(),updated_at=now()
  where user_id=v_uid;

  if v_row.status='locked' then
    return query select false,'This account was locked by the admin. Please contact the admin on WhatsApp.'; return;
  end if;

  if upper(trim(coalesce(p_pin,'')))<>upper(v_row.access_pin) then
    insert into public.psp_pin_attempt_rate_v484(user_id,fail_count,window_started_at,locked_until,updated_at)
    values(v_uid,1,now(),null,now())
    on conflict(user_id) do update set
      fail_count=case when public.psp_pin_attempt_rate_v484.window_started_at<now()-interval '15 minutes'
                      then 1 else public.psp_pin_attempt_rate_v484.fail_count+1 end,
      window_started_at=case when public.psp_pin_attempt_rate_v484.window_started_at<now()-interval '15 minutes'
                             then now() else public.psp_pin_attempt_rate_v484.window_started_at end,
      locked_until=case
        when public.psp_pin_attempt_rate_v484.window_started_at<now()-interval '15 minutes' then null
        when public.psp_pin_attempt_rate_v484.fail_count+1>=8 then now()+interval '15 minutes'
        else public.psp_pin_attempt_rate_v484.locked_until end,
      updated_at=now()
    returning fail_count,locked_until into v_fail_count,v_locked_until;

    delete from public.psp_pin_attempt_rate_v484 where updated_at<now()-interval '2 days';

    if v_locked_until is not null and v_locked_until>now() then
      return query select false,'Too many incorrect PIN attempts. Please wait 15 minutes and try again.';
    else
      return query select false,'Incorrect PIN. Please contact the admin and request your free access PIN.';
    end if;
    return;
  end if;

  delete from public.psp_pin_attempt_rate_v484 where user_id=v_uid;
  update public.user_access_pins
  set status='active',activated_at=now(),locked_at=null,updated_at=now()
  where user_id=v_uid;

  return query select true,'PIN activated successfully. All protected features are now unlocked.';
end;
$function$;

revoke all on function public.psp_activate_my_access_pin(text) from public,anon;
grant execute on function public.psp_activate_my_access_pin(text) to authenticated,service_role;

commit;
