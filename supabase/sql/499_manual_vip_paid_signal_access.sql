-- PipSePaisa V499 — Manual VIP / Paid Signals access.
-- Adds a secure Admin-only manual VIP subscription RPC and makes active
-- VIP subscriptions an authoritative Signals-access source.

CREATE OR REPLACE FUNCTION public.psp_signal_user_has_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  uid uuid := auth.uid();
  payload jsonb := '{}'::jsonb;
begin
  if uid is null then return false; end if;

  if exists (
    select 1
    from public.subscriptions s
    join public.subscription_plans sp on sp.id=s.plan_id
    where s.user_id=uid
      and lower(coalesce(s.status,''))='active'
      and (s.ends_at is null or s.ends_at>now())
      and lower(coalesce(sp.member_type,''))='vip'
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.account_verifications av
    where av.user_id=uid
      and (
        (
          lower(coalesce(av.submission_status,''))='approved'
          and av.approved_expires_at is not null
          and av.approved_expires_at > now()
        )
        or lower(coalesce(av.submission_status,''))='pending'
        or (av.admin_trial_expires_at is not null and av.admin_trial_expires_at > now())
      )
  ) then
    return true;
  end if;

  begin
    select to_jsonb(s) into payload
    from public.psp_get_access_status() s
    limit 1;

    if coalesce((payload->>'direct_access_active')::boolean,false)
       or coalesce((payload->>'temporary_access')::boolean,false)
    then
      return true;
    end if;
  exception when others then null;
  end;

  return false;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_admin_manual_vip_v499(
  p_identifier text,
  p_action text DEFAULT 'status',
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_identifier text:=btrim(coalesce(p_identifier,''));
  v_action text:=lower(btrim(coalesce(p_action,'status')));
  v_days integer:=greatest(1,least(coalesce(p_days,30),365));
  v_user public.profiles%rowtype;
  v_plan public.subscription_plans%rowtype;
  v_base timestamptz;
  v_end timestamptz;
  v_manual_end timestamptz;
  v_overall_end timestamptz;
  v_manual_active boolean:=false;
  v_overall_active boolean:=false;
  v_sub_id uuid;
  v_ref text;
  v_current_member_type text;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;
  if v_identifier='' then raise exception 'Enter user email, Client ID or User ID.'; end if;

  select p.* into v_user
  from public.profiles p
  where p.id::text=v_identifier
     or lower(coalesce(p.email,''))=lower(v_identifier)
     or lower(coalesce(p.client_id,''))=lower(v_identifier)
  order by
    case when p.id::text=v_identifier then 0
         when lower(coalesce(p.email,''))=lower(v_identifier) then 1
         else 2 end
  limit 1;
  if not found then raise exception 'User not found.'; end if;

  select sp.* into v_plan
  from public.subscription_plans sp
  where sp.is_active=true
    and sp.is_official=true
    and lower(coalesce(sp.member_type,''))='vip'
  order by sp.display_order nulls last,sp.created_at asc
  limit 1;
  if not found then raise exception 'Official VIP plan is not configured.'; end if;

  if v_action='grant' then
    select max(s.ends_at) into v_base
    from public.subscriptions s
    join public.subscription_plans sp on sp.id=s.plan_id
    where s.user_id=v_user.id
      and lower(coalesce(s.status,''))='active'
      and (s.ends_at is null or s.ends_at>now())
      and lower(coalesce(sp.member_type,''))='vip';

    v_base:=greatest(now(),coalesce(v_base,now()));
    v_end:=v_base+make_interval(days=>v_days);
    v_ref:='manual-admin:'||auth.uid()::text||':'||floor(extract(epoch from clock_timestamp()))::bigint::text;

    insert into public.subscriptions(
      user_id,plan_id,status,starts_at,ends_at,amount,currency,payment_reference,created_at,updated_at
    ) values(
      v_user.id,v_plan.id,'active',now(),v_end,0,v_plan.currency,v_ref,now(),now()
    )
    returning id into v_sub_id;

    perform public.psp_sync_profile_membership_v446(v_user.id);

  elsif v_action='revoke' then
    update public.subscriptions s
       set status='cancelled',
           ends_at=least(coalesce(s.ends_at,now()),now()),
           updated_at=now()
     where s.user_id=v_user.id
       and lower(coalesce(s.status,''))='active'
       and coalesce(s.payment_reference,'') like 'manual-admin:%';

    perform public.psp_sync_profile_membership_v446(v_user.id);

  elsif v_action<>'status' then
    raise exception 'Unsupported action. Use status, grant or revoke.';
  end if;

  select
    max(s.ends_at) filter (
      where lower(coalesce(s.status,''))='active'
        and (s.ends_at is null or s.ends_at>now())
        and coalesce(s.payment_reference,'') like 'manual-admin:%'
    ),
    bool_or(
      lower(coalesce(s.status,''))='active'
      and (s.ends_at is null or s.ends_at>now())
      and coalesce(s.payment_reference,'') like 'manual-admin:%'
    ),
    max(s.ends_at) filter (
      where lower(coalesce(s.status,''))='active'
        and (s.ends_at is null or s.ends_at>now())
    ),
    bool_or(
      lower(coalesce(s.status,''))='active'
      and (s.ends_at is null or s.ends_at>now())
    )
  into v_manual_end,v_manual_active,v_overall_end,v_overall_active
  from public.subscriptions s
  join public.subscription_plans sp on sp.id=s.plan_id
  where s.user_id=v_user.id
    and lower(coalesce(sp.member_type,''))='vip';

  select p.member_type into v_current_member_type
  from public.profiles p where p.id=v_user.id;

  return jsonb_build_object(
    'ok',true,
    'action',v_action,
    'user_id',v_user.id,
    'client_id',v_user.client_id,
    'full_name',v_user.full_name,
    'email',v_user.email,
    'manual_active',coalesce(v_manual_active,false),
    'manual_expires_at',v_manual_end,
    'vip_active',coalesce(v_overall_active,false),
    'vip_expires_at',v_overall_end,
    'member_type',coalesce(v_current_member_type,'free'),
    'days_added',case when v_action='grant' then v_days else null end,
    'subscription_id',v_sub_id,
    'message',case
      when v_action='grant' then format('Manual VIP access added for %s days.',v_days)
      when v_action='revoke' then 'Manual VIP access removed.'
      else 'VIP access status loaded.'
    end
  );
end;
$function$;

REVOKE ALL ON FUNCTION public.psp_admin_manual_vip_v499(text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.psp_admin_manual_vip_v499(text,text,integer) TO authenticated,service_role;
