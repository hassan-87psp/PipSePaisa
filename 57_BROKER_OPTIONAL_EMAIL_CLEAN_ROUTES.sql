-- ============================================================
-- PIPSEPAISA V72 — BROKER PROOF OPTIONAL EMAIL + CLEAN FLOW
-- Run after V70 broker verification SQL. Safe to re-run.
-- ============================================================

comment on column public.account_verifications.proof_path is
  'Optional broker confirmation email/screenshot proof path in verification-proofs bucket.';

create or replace function public.psp_submit_access_verification(
  p_broker text,
  p_trading_account_id text,
  p_available_deposit numeric,
  p_email_subject text,
  p_deposit_proof_path text,
  p_proof_path text,
  p_existing_account boolean default false
)
returns table(success boolean, message text, status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  b text := lower(trim(coalesce(p_broker,'')));
  current_status text;
  verified_at_value timestamptz;
  optional_proof text := nullif(trim(coalesce(p_proof_path,'')),'');
begin
  if uid is null then raise exception 'Authentication required.'; end if;
  if b not in ('exness','dprime','xm') then raise exception 'Please select a valid broker.'; end if;
  if nullif(trim(coalesce(p_trading_account_id,'')),'') is null then raise exception 'Trading Account ID is required.'; end if;
  if p_available_deposit is null or p_available_deposit < 0 then raise exception 'Available deposit is required.'; end if;
  if nullif(trim(coalesce(p_email_subject,'')),'') is null then raise exception 'Email Subject is required.'; end if;
  if nullif(trim(coalesce(p_deposit_proof_path,'')),'') is null then raise exception 'Proof of Deposit is required.'; end if;
  if split_part(p_deposit_proof_path,'/',1) <> uid::text then raise exception 'Invalid deposit proof path.'; end if;
  if optional_proof is not null and split_part(optional_proof,'/',1) <> uid::text then raise exception 'Invalid broker proof path.'; end if;

  select av.submission_status, av.email_verified_at
  into current_status, verified_at_value
  from public.account_verifications av
  where av.user_id = uid;

  if current_status='approved' then
    return query select true, 'Your account is already approved.', 'approved'::text;
    return;
  end if;

  if verified_at_value is null then
    select case
      when u.email_confirmed_at is not null and u.confirmation_sent_at is not null then u.email_confirmed_at
      else null
    end
    into verified_at_value
    from auth.users u
    where u.id = uid;
  end if;

  if verified_at_value is null then raise exception 'Verify your email first from Profile.'; end if;

  insert into public.account_verifications(
    user_id,email_verified_at,broker,trading_account_id,available_deposit,email_subject,
    deposit_proof_path,proof_path,existing_account,submission_status,submitted_at,
    temporary_access_at,rejection_reason,reviewed_by,reviewed_at,updated_at
  ) values (
    uid,verified_at_value,b,trim(p_trading_account_id),p_available_deposit,trim(p_email_subject),
    trim(p_deposit_proof_path),optional_proof,coalesce(p_existing_account,false),'pending',now(),
    now(),null,null,null,now()
  )
  on conflict (user_id) do update set
    email_verified_at=coalesce(public.account_verifications.email_verified_at,excluded.email_verified_at),
    broker=excluded.broker,
    trading_account_id=excluded.trading_account_id,
    available_deposit=excluded.available_deposit,
    email_subject=excluded.email_subject,
    deposit_proof_path=excluded.deposit_proof_path,
    proof_path=excluded.proof_path,
    existing_account=excluded.existing_account,
    submission_status='pending',
    submitted_at=now(),
    temporary_access_at=now(),
    rejection_reason=null,
    reviewed_by=null,
    reviewed_at=null,
    updated_at=now();

  return query select true,
    'Verification submitted. Temporary access is active while Admin reviews your account.',
    'pending'::text;
end;
$$;

revoke all on function public.psp_submit_access_verification(text,text,numeric,text,text,text,boolean) from public;
grant execute on function public.psp_submit_access_verification(text,text,numeric,text,text,text,boolean) to authenticated, service_role;
