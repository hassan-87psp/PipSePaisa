-- PipSePaisa V467
-- Single authoritative access snapshot for the logged-in user.
-- Combines email verification, broker submission state, approval expiry
-- and temporary/direct access into one RPC so the UI cannot show stale
-- "Verify Email" or "No Active Access" states from separate requests.

create or replace function public.psp_get_access_snapshot_v467()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  s record;
  expiry jsonb;
  approved_active_value boolean := false;
  approved_expires_value timestamptz := null;
  final_status text := 'not_submitted';
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select * into s
  from public.psp_get_access_status()
  limit 1;

  expiry := public.psp_get_access_expiry_v116();

  final_status := coalesce(
    nullif(expiry->>'submission_status',''),
    s.submission_status,
    'not_submitted'
  );

  approved_active_value := coalesce((expiry->>'approved_active')::boolean,false);

  if nullif(expiry->>'approved_expires_at','') is not null then
    approved_expires_value := (expiry->>'approved_expires_at')::timestamptz;
  end if;

  return jsonb_build_object(
    'verification_required', coalesce(s.verification_required,true),
    'email_verified', coalesce(s.email_verified,false),
    'email_verified_at', s.email_verified_at,
    'submission_status', final_status,
    'approved_active', approved_active_value,
    'approved_expires_at', approved_expires_value,
    'can_access', coalesce(s.can_access,false) or approved_active_value,
    'temporary_access', coalesce(s.temporary_access,false),
    'direct_access_enabled', coalesce(s.direct_access_enabled,false),
    'direct_access_active', coalesce(s.direct_access_active,false),
    'direct_access_expires_at', s.direct_access_expires_at,
    'direct_access_remaining_seconds', coalesce(s.direct_access_remaining_seconds,0),
    'broker', s.broker,
    'trading_account_id', s.trading_account_id,
    'available_deposit', s.available_deposit,
    'submitted_at', s.submitted_at,
    'rejection_reason', coalesce(expiry->>'rejection_reason',s.rejection_reason),
    'admin_whatsapp', s.admin_whatsapp,
    'recommended_deposit', s.recommended_deposit
  );
end;
$function$;

grant execute on function public.psp_get_access_snapshot_v467() to authenticated;
