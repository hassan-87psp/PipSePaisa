-- PipSePaisa V466
-- Preserve email-verification status for users who already existed before
-- the V49 post-login verification rollout.
--
-- V49 introduced account_verifications.email_verified_at while Supabase Auth
-- remained configured for direct signup/login. Legacy accounts that were already
-- confirmed in auth.users could therefore appear as "Verify Email" again if they
-- did not yet have a row in account_verifications.
--
-- This migration only grandfathers accounts created before the configured
-- verification rollout timestamp. Newer users still need the normal
-- PipSePaisa verification-email flow.

with cutoff as (
  select coalesce(
    (select direct_access_rollout_at
       from public.account_verification_settings
      where id = 1),
    '2026-08-12 08:30:15.297392+00'::timestamptz
  ) as ts
),
eligible as (
  select
    u.id as user_id,
    u.email_confirmed_at as verified_at
  from auth.users u
  cross join cutoff c
  left join public.account_verifications av
    on av.user_id = u.id
  where u.created_at < c.ts
    and u.email_confirmed_at is not null
    and av.email_verified_at is null
)
insert into public.account_verifications (
  user_id,
  email_verified_at,
  updated_at
)
select
  e.user_id,
  e.verified_at,
  now()
from eligible e
on conflict (user_id) do update
set
  email_verified_at = coalesce(
    public.account_verifications.email_verified_at,
    excluded.email_verified_at
  ),
  updated_at = case
    when public.account_verifications.email_verified_at is null then now()
    else public.account_verifications.updated_at
  end;
