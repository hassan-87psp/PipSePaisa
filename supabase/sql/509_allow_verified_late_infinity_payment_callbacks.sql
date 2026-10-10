-- PipSePaisa: Infinity payment callback delivery can lag behind the 20-minute checkout window.
-- This migration was applied to the production database on 10 October 2026.
-- Only service_role can verify a request-specific SHA-256 token or finalize a payment.
-- Allow bank webhooks up to 48 hours after the original checkout expiry.
-- The finalizer strictly matches stored transaction amount and preserves already-approved
-- enrollments that belong to a DIFFERENT payment request.
-- No historical payments are approved or changed by this migration.
begin;
CREATE OR REPLACE FUNCTION public.psp_verify_payment_callback_v493(p_scope text, p_request_id bigint, p_token text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists(
    select 1
    from public.psp_payment_callback_secrets_v493 s
    where s.payment_scope=p_scope
      and s.provider_request_id=p_request_id
      and s.token_hash=encode(extensions.digest(coalesce(p_token,''),'sha256'),'hex')
      and (coalesce(s.expires_at,s.created_at + interval '20 minutes') >= now() - interval '48 hours')
      and (
        (
          p_scope='course'
          and exists(
            select 1
            from public.course_payments cp
            where cp.provider='infinity'
              and cp.provider_request_id=p_request_id
              and lower(coalesce(cp.provider_status,cp.status,'')) in ('initiated','pending','processing','created','expired')
              and (coalesce(cp.provider_expires_at,cp.created_at + interval '20 minutes') >= now() - interval '48 hours')
          )
        )
        or
        (
          p_scope='vip'
          and exists(
            select 1
            from public.payment_requests pr
            where pr.provider='infinity'
              and pr.provider_request_id=p_request_id
              and lower(coalesce(pr.provider_status,pr.status,'')) in ('initiated','pending','processing','created','expired')
              and (coalesce(pr.provider_expires_at,pr.created_at + interval '20 minutes') >= now() - interval '48 hours')
          )
        )
      )
  );
$function$;
CREATE OR REPLACE FUNCTION public.finalize_infinity_payment(p_request_id bigint, p_provider_status text, p_callback_amount numeric, p_rejection_reason text DEFAULT NULL::text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(payment_id uuid, user_id uuid, enrollment_id uuid, course_key text, course_name text, amount numeric, currency text, user_email text, user_name text, provider_status text, idempotent boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  p public.course_payments%rowtype;
  e public.course_enrollments%rowtype;
  v_status text := lower(btrim(coalesce(p_provider_status,'')));
  v_current text;
  v_reason text := nullif(btrim(coalesce(p_rejection_reason,'')),'');
  v_idempotent boolean := false;
begin
  if p_request_id is null or p_request_id<=0 then
    raise exception 'Invalid Infinity request id.';
  end if;
  if v_status not in ('accepted','rejected','expired') then
    raise exception 'Unsupported Infinity payment status.';
  end if;
  if p_callback_amount is null or p_callback_amount<=0 then
    raise exception 'Invalid Infinity callback amount.';
  end if;

  select * into p
  from public.course_payments cp
  where cp.provider='infinity'
    and cp.provider_request_id=p_request_id
  order by cp.created_at desc nulls last
  limit 1
  for update;

  if not found then raise exception 'Infinity payment request not found.'; end if;
  if coalesce(p.amount,0)<=0 or abs(p.amount-p_callback_amount)>0.01 then
    raise exception 'Infinity callback amount does not match payment request.';
  end if;

  v_current:=lower(btrim(coalesce(p.provider_status,p.status,'')));
  if v_current in ('accepted','approved','success','successful','completed','complete','paid','captured','confirmed','verified','settled') then
    if v_status<>'accepted' then raise exception 'Conflicting callback for an already accepted payment.'; end if;
    v_idempotent:=true;
  elsif v_current in ('rejected','declined','failed','failure','cancelled','canceled','void','reversed') then
    if v_status<>'rejected' then raise exception 'Conflicting callback for an already rejected payment.'; end if;
    v_idempotent:=true;
  elsif v_current='expired' then
    if v_status='expired' then
      v_idempotent:=true;
    elsif v_status='accepted'
      and coalesce(p.provider_expires_at,p.created_at + interval '20 minutes') >= now() - interval '48 hours' then
      -- The public webhook authenticates the exact request token first.
      -- A late bank acceptance must not be lost to the 20-minute UI timeout.
      null;
    else
      raise exception 'Conflicting callback for an already expired payment.';
    end if;
  end if;

  if not v_idempotent then
    begin
      update public.course_payments
      set status=case when v_status='accepted' then 'approved'
                      when v_status='rejected' then 'declined'
                      else 'initiated' end,
          provider_status=v_status,
          provider_callback_at=now(),
          provider_callback_payload=coalesce(p_payload,'{}'::jsonb),
          provider_last_error=case
            when v_status='rejected' then coalesce(v_reason,'Payment rejected by Infinity.')
            when v_status='expired' then coalesce(v_reason,'Infinity payment window expired.')
            else null end,
          provider_expires_at=case when v_status='expired' then coalesce(provider_expires_at,now()) else provider_expires_at end,
          updated_at=now()
      where id=p.id;
    exception when check_violation then
      update public.course_payments
      set provider_status=v_status,
          provider_callback_at=now(),
          provider_callback_payload=coalesce(p_payload,'{}'::jsonb),
          provider_last_error=case
            when v_status='rejected' then coalesce(v_reason,'Payment rejected by Infinity.')
            when v_status='expired' then coalesce(v_reason,'Infinity payment window expired.')
            else null end,
          provider_expires_at=case when v_status='expired' then coalesce(provider_expires_at,now()) else provider_expires_at end,
          updated_at=now()
      where id=p.id;
    end;

    if p.enrollment_id is null then raise exception 'Infinity payment enrollment is missing.'; end if;

    if v_status='accepted' then
      update public.course_enrollments
      set payment_status='approved',
          enrollment_status='enrolled',
          access_granted_at=coalesce(access_granted_at,now()),
          payment_method='Local Bank Transfer',
          payment_provider='infinity',
          provider_request_id=p_request_id,
          provider_status='accepted',
          provider_rejection_reason=null,
          provider_callback_payload=coalesce(p_payload,'{}'::jsonb),
          provider_callback_at=now(),
          provider_last_error=null,
          rejection_reason=null,
          transaction_id=p_request_id::text,
          updated_at=now()
      where id=p.enrollment_id and user_id=p.user_id
        and not (payment_status='approved' and enrollment_status='enrolled'
                 and provider_request_id is distinct from p_request_id);
    elsif v_status='rejected' then
      update public.course_enrollments
      set payment_status='rejected',
          enrollment_status='rejected',
          access_granted_at=null,
          payment_method='Local Bank Transfer',
          payment_provider='infinity',
          provider_request_id=p_request_id,
          provider_status='rejected',
          provider_rejection_reason=coalesce(v_reason,'Payment rejected by Infinity.'),
          provider_callback_payload=coalesce(p_payload,'{}'::jsonb),
          provider_callback_at=now(),
          provider_last_error=coalesce(v_reason,'Payment rejected by Infinity.'),
          rejection_reason=coalesce(v_reason,'Payment rejected by Infinity.'),
          transaction_id=p_request_id::text,
          updated_at=now()
      where id=p.enrollment_id and user_id=p.user_id
        and coalesce(payment_status,'')<>'approved'
        and coalesce(enrollment_status,'')<>'enrolled';
    else
      update public.course_enrollments
      set payment_status='pending',
          enrollment_status='pending',
          access_granted_at=null,
          payment_method='Local Bank Transfer',
          payment_provider='infinity',
          provider_request_id=p_request_id,
          provider_status='expired',
          provider_rejection_reason=coalesce(v_reason,'Infinity payment window expired.'),
          provider_callback_payload=coalesce(p_payload,'{}'::jsonb),
          provider_callback_at=now(),
          provider_last_error='Infinity payment window expired. Start a new Local Bank Transfer.',
          rejection_reason=null,
          provider_redirect_url=null,
          transaction_id=p_request_id::text,
          updated_at=now()
      where id=p.enrollment_id and user_id=p.user_id
        and coalesce(payment_status,'')<>'approved'
        and coalesce(enrollment_status,'')<>'enrolled';
    end if;
  end if;

  select * into e from public.course_enrollments where id=p.enrollment_id limit 1;

  return query
  select p.id,
         p.user_id,
         p.enrollment_id,
         p.course_key,
         coalesce(nullif(p.course_name,''),e.course_name),
         p.amount,
         p.currency,
         e.email,
         coalesce(nullif(e.full_name,''),'Student'),
         v_status,
         v_idempotent;
end;
$function$;
revoke all on function public.psp_verify_payment_callback_v493(text,bigint,text) from public,anon,authenticated;
grant execute on function public.psp_verify_payment_callback_v493(text,bigint,text) to service_role;
revoke all on function public.finalize_infinity_payment(bigint,text,numeric,text,jsonb) from public,anon,authenticated;
grant execute on function public.finalize_infinity_payment(bigint,text,numeric,text,jsonb) to service_role;
commit;
