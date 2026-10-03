-- V440: fix Infinity 20-minute expiry for orphan/stale course enrollments.
-- Root causes fixed:
-- 1) old Infinity enrollment rows can have provider_expires_at/provider_status/provider_request_id = NULL;
-- 2) pg_cron has no PostgREST JWT, so the protected course_enrollments trigger rejected watchdog updates.
-- The watchdog now derives expiry from created_at + 20 minutes, runs in trusted service context,
-- and the admin reconcile RPC treats NULL provider_status as pending.

create or replace function public.psp_expire_stale_infinity_payments_v171()
returns integer
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  r record;
  v_count integer := 0;
  v_reason text := 'Payment window expired after 20 minutes before a final provider confirmation was received.';
begin
  perform set_config('request.jwt.claim.role','service_role',true);

  for r in
    select
      e.id,
      e.provider_request_id,
      coalesce(e.provider_expires_at, e.created_at + interval '20 minutes') as effective_expires_at
    from public.course_enrollments e
    where lower(coalesce(e.payment_provider,'')) = 'infinity'
      and lower(coalesce(e.payment_status,'pending')) <> 'approved'
      and lower(coalesce(e.enrollment_status,'pending')) <> 'enrolled'
      and lower(coalesce(e.provider_status,'initiated')) in (
        'initiated','created','submitted','pending','processing','waiting',
        'awaiting','in_process','queued'
      )
      and coalesce(e.provider_expires_at, e.created_at + interval '20 minutes') <= now()
    for update skip locked
  loop
    update public.course_enrollments
       set provider_status = 'expired',
           provider_expires_at = r.effective_expires_at,
           provider_redirect_url = null,
           provider_last_error = 'Infinity payment window expired. Start a new Local Bank Transfer.',
           provider_rejection_reason = 'Infinity payment window expired.',
           payment_status = 'pending',
           enrollment_status = 'pending',
           access_granted_at = null,
           rejection_reason = null,
           reviewed_by = null,
           reviewed_at = null,
           updated_at = now()
     where id = r.id
       and lower(coalesce(payment_status,'pending')) <> 'approved'
       and lower(coalesce(enrollment_status,'pending')) <> 'enrolled';

    if found then
      v_count := v_count + 1;

      update public.course_payments
         set provider_status = 'expired',
             provider_expires_at = coalesce(provider_expires_at, r.effective_expires_at),
             provider_last_error = v_reason,
             updated_at = now()
       where provider = 'infinity'
         and enrollment_id = r.id
         and lower(coalesce(provider_status,status,'pending')) in (
           'initiated','created','submitted','pending','processing','waiting',
           'awaiting','in_process','queued'
         );
    end if;
  end loop;

  return v_count;
end;
$function$;

revoke all on function public.psp_expire_stale_infinity_payments_v171() from public;
revoke all on function public.psp_expire_stale_infinity_payments_v171() from anon;
revoke all on function public.psp_expire_stale_infinity_payments_v171() from authenticated;
grant execute on function public.psp_expire_stale_infinity_payments_v171() to service_role;

create or replace function public.psp_reconcile_all_infinity_expiry()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count integer:=0;
  v_more integer:=0;
begin
  if auth.uid() is null or not public.psp_is_admin() then
    raise exception 'Admin access required.';
  end if;

  with stale as (
    select cp.id,cp.user_id,cp.enrollment_id,cp.provider_request_id,
           coalesce(cp.provider_expires_at,cp.created_at+interval '20 minutes') as expires_at
    from public.course_payments cp
    where cp.provider='infinity'
      and lower(coalesce(cp.provider_status,cp.status,'')) in (
        'initiated','created','submitted','pending','processing','waiting','awaiting','in_process','queued'
      )
      and coalesce(cp.provider_expires_at,cp.created_at+interval '20 minutes')<=now()
  ), upd as (
    update public.course_payments cp
       set provider_status='expired',
           provider_expires_at=s.expires_at,
           provider_last_error='Infinity payment window expired.',
           updated_at=now()
      from stale s
     where cp.id=s.id
     returning cp.user_id,cp.enrollment_id,cp.provider_request_id,cp.provider_expires_at as expires_at
  )
  update public.course_enrollments ce
     set provider_status='expired',
         provider_expires_at=u.expires_at,
         provider_redirect_url=null,
         provider_last_error='Infinity payment window expired. Start a new Local Bank Transfer.',
         provider_rejection_reason='Infinity payment window expired.',
         payment_status='pending',
         enrollment_status='pending',
         access_granted_at=null,
         rejection_reason=null,
         reviewed_by=null,
         reviewed_at=null,
         updated_at=now()
    from upd u
   where ce.id=u.enrollment_id and ce.user_id=u.user_id
     and ce.provider_request_id=u.provider_request_id
     and coalesce(ce.payment_status,'')<>'approved'
     and coalesce(ce.enrollment_status,'')<>'enrolled';

  get diagnostics v_count=row_count;

  update public.course_enrollments ce
     set provider_status='expired',
         provider_expires_at=coalesce(ce.provider_expires_at,ce.created_at+interval '20 minutes'),
         provider_redirect_url=null,
         provider_last_error='Infinity payment window expired. Start a new Local Bank Transfer.',
         provider_rejection_reason='Infinity payment window expired.',
         payment_status='pending',
         enrollment_status='pending',
         access_granted_at=null,
         rejection_reason=null,
         reviewed_by=null,
         reviewed_at=null,
         updated_at=now()
   where (lower(coalesce(ce.payment_provider,''))='infinity'
          or lower(coalesce(ce.payment_method,'')) like '%local bank%')
     and lower(coalesce(ce.provider_status,'pending')) in (
       'initiated','created','submitted','pending','processing','waiting','awaiting','in_process','queued'
     )
     and coalesce(ce.provider_expires_at,ce.created_at+interval '20 minutes')<=now()
     and coalesce(ce.payment_status,'')<>'approved'
     and coalesce(ce.enrollment_status,'')<>'enrolled';

  get diagnostics v_more=row_count;
  return v_count+v_more;
end;
$function$;

-- Heal any already-stuck Infinity attempts when this migration is installed.
select public.psp_expire_stale_infinity_payments_v171();
