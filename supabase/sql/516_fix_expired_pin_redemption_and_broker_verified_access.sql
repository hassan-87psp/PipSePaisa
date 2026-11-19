-- PipSePaisa access-flow correctness fix, applied on 2026-11-19.
-- Schema only: never resets, grants, revokes, or migrates any user record.
-- 1) Expired pending PINs are redeemable with the correct PIN.
-- 2) Active, unexpired broker approvals unlock protected access through their exact expiry.
-- 3) An expired verification status does not grant access on its own.
-- 4) Explicit admin locks remain respected.

CREATE OR REPLACE FUNCTION public.psp_get_my_access_status()
 RETURNS TABLE(pin_status text, is_locked boolean, grace_started_at timestamp with time zone, grace_expires_at timestamp with time zone, activated_at timestamp with time zone, remaining_seconds bigint, admin_whatsapp text, access_enabled boolean, grace_value integer, grace_unit text, lock_title text, lock_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user uuid:=auth.uid();
  v_verified_until timestamptz;
begin
  if v_user is null then return; end if;

  -- Expiring a grace period must not permanently lock a PIN record.
  -- Keep 'locked' for explicit admin actions; correct PIN remains redeemable.
  select max(v.approved_expires_at) into v_verified_until
  from public.account_verifications v
  where v.user_id=v_user and lower(coalesce(v.submission_status,''))='approved'
    and v.approved_expires_at>now();

  return query
  select
    case
      when coalesce(p.is_premium,false)=true
       and (p.premium_until is null or p.premium_until>now())
      then 'active'::text
      else u.status::text
    end,
    case
      when not s.is_enabled then false
      when coalesce(p.is_premium,false)=true
       and (p.premium_until is null or p.premium_until>now()) then false
      when lower(replace(coalesce(p.role::text,'user'),'-','_'))
           in ('admin','super_admin','superadmin','owner','mentor','psp_mentor','psp mentor') then false
      when u.status='active' then false
      when u.status='locked' then true
      when v_verified_until is not null then false
      when now()>=u.grace_expires_at then true
      else false
    end,
    u.grace_started_at,
    case when v_verified_until is not null and u.status<>'locked'
      then greatest(u.grace_expires_at,v_verified_until)
      else u.grace_expires_at end,
    case
      when coalesce(p.is_premium,false)=true
       and (p.premium_until is null or p.premium_until>now())
      then coalesce(u.activated_at,now())
      else u.activated_at
    end,
    case
      when coalesce(p.is_premium,false)=true and p.premium_until is not null and p.premium_until>now()
      then greatest(0,floor(extract(epoch from (p.premium_until-now())))::bigint)
      when v_verified_until is not null and u.status<>'locked'
      then greatest(0,floor(extract(epoch from (greatest(u.grace_expires_at,v_verified_until)-now())))::bigint)
      else greatest(0,floor(extract(epoch from (u.grace_expires_at-now())))::bigint)
    end,
    s.admin_whatsapp,
    s.is_enabled,
    s.grace_value,
    s.grace_unit,
    s.lock_title,
    s.lock_message
  from public.user_access_pins u
  join public.profiles p on p.id=u.user_id
  cross join public.pin_access_settings s
  where u.user_id=v_user and s.id=1;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_has_content_access()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select case
    when auth.uid() is null then false
    when exists (
      select 1 from public.profiles p
      where p.id=auth.uid()
        and lower(coalesce(p.role::text,'user')) in ('admin','super_admin','superadmin','owner','mentor','psp_mentor','psp mentor')
    ) then true
    when exists (select 1 from public.profiles p where p.id=auth.uid()
       and p.is_premium is true and p.premium_until>now()) then true
    when exists (select 1 from public.subscriptions sub
       join public.subscription_plans plan on plan.id=sub.plan_id
       where sub.user_id=auth.uid() and lower(coalesce(sub.status,''))='active'
         and lower(coalesce(plan.member_type,''))='vip' and sub.ends_at>now()) then true
    when not coalesce((select is_enabled from public.pin_access_settings where id=1), true) then true
    -- Preserve an explicit admin lock, but not a naturally expired grace timer.
    when exists (select 1 from public.user_access_pins u where u.user_id=auth.uid() and u.status='locked') then false
    -- Current broker verification grants protected content for its exact validity.
    when exists (select 1 from public.account_verifications v where v.user_id=auth.uid()
      and lower(coalesce(v.submission_status,''))='approved' and v.approved_expires_at>now()) then true
    else exists (
      select 1 from public.user_access_pins u
      where u.user_id=auth.uid()
        and (u.status='active' or (u.status='pending' and now() < u.grace_expires_at))
    )
  end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_get_access_status()
 RETURNS TABLE(verification_required boolean, email_verified boolean, email_verified_at timestamp with time zone, submission_status text, can_access boolean, temporary_access boolean, broker text, trading_account_id text, available_deposit numeric, submitted_at timestamp with time zone, rejection_reason text, admin_whatsapp text, recommended_deposit numeric, direct_access_enabled boolean, direct_access_days integer, direct_access_active boolean, direct_access_expires_at timestamp with time zone, direct_access_remaining_seconds bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  uid uuid := auth.uid();
  user_created_at timestamptz;
  legacy_verified_at timestamptz;
  enabled_value boolean := true;
  days_value integer := 7;
  rollout_value timestamptz;
  global_expires timestamptz;
  manual_expires timestamptz;
  effective_expires timestamptz;
  current_status text := 'not_submitted';
  trial_active boolean := false;
  vip_expires timestamptz := null;
  vip_active boolean := false;
begin
  if uid is null then raise exception 'Authentication required.'; end if;

  select u.created_at,
         case when u.email_confirmed_at is not null and u.confirmation_sent_at is not null
              then u.email_confirmed_at else null end
    into user_created_at, legacy_verified_at
    from auth.users u
   where u.id = uid;

  select coalesce(s.direct_access_enabled,true),
         greatest(0,least(coalesce(s.direct_access_days,7),365)),
         coalesce(s.direct_access_rollout_at,s.updated_at,user_created_at,now())
    into enabled_value, days_value, rollout_value
    from public.account_verification_settings s
   where s.id = 1;

  if not found then
    enabled_value := true;
    days_value := 7;
    rollout_value := coalesce(user_created_at,now());
  end if;

  select coalesce(v.submission_status,'not_submitted'), v.admin_trial_expires_at
    into current_status, manual_expires
    from (select 1) q
    left join public.account_verifications v on v.user_id = uid;

  global_expires := greatest(
      coalesce(user_created_at,now()),
      coalesce(rollout_value,user_created_at,now())
    ) + make_interval(days => days_value);

  -- Automatic signup grace applies even before email verification.
  -- Rejected submissions lose automatic grace, but Admin may explicitly grant a manual trial.
  if enabled_value and days_value > 0 and current_status <> 'rejected' and global_expires > now() then
    effective_expires := global_expires;
  end if;

  if manual_expires is not null and manual_expires > now() then
    effective_expires := case
      when effective_expires is null then manual_expires
      else greatest(effective_expires, manual_expires)
    end;
  end if;

  trial_active := effective_expires is not null and effective_expires > now();
  -- Paid/manual VIP is independent of PIN grace and broker verification.
  select max(z.expires_at) into vip_expires from (
    select p.premium_until as expires_at from public.profiles p
    where p.id=uid and p.is_premium is true and p.premium_until>now()
    union all
    select sub.ends_at as expires_at from public.subscriptions sub
    join public.subscription_plans plan on plan.id=sub.plan_id
    where sub.user_id=uid and lower(coalesce(sub.status,''))='active'
      and lower(coalesce(plan.member_type,''))='vip' and sub.ends_at>now()
  ) z;
  vip_active := vip_expires is not null and vip_expires>now();

  return query
  select
    true,
    (coalesce(v.email_verified_at,legacy_verified_at) is not null),
    coalesce(v.email_verified_at,legacy_verified_at),
    coalesce(v.submission_status,'not_submitted'),
    case
      when vip_active then true
      when lower(coalesce(v.submission_status,'')) = 'approved'
       and v.approved_expires_at > now() then true
      when trial_active then true
      when coalesce(v.email_verified_at,legacy_verified_at) is not null and v.submission_status = 'pending' then true
      else false
    end,
    (trial_active or vip_active)
      or (coalesce(v.email_verified_at,legacy_verified_at) is not null and v.submission_status = 'pending'),
    v.broker,
    v.trading_account_id,
    v.available_deposit,
    v.submitted_at,
    v.rejection_reason,
    coalesce(s.admin_whatsapp,'601156961157'),
    coalesce(s.recommended_deposit,300),
    (coalesce(s.direct_access_enabled,true) or vip_active),
    coalesce(s.direct_access_days,7),
    (trial_active or vip_active),
    greatest(effective_expires,vip_expires),
    case when greatest(effective_expires,vip_expires) is null then 0
      else greatest(0,extract(epoch from (greatest(effective_expires,vip_expires)-now()))::bigint)
    end
  from (select 1 as x) q
  left join public.account_verification_settings s on s.id = 1
  left join public.account_verifications v on v.user_id = uid;
end;
$function$;
