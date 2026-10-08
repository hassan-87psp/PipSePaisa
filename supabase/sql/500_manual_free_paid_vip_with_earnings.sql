-- PipSePaisa V500 — Manual Free/Paid VIP access with Finance/Earnings.
-- Paid access requires a receipt and records VIP Access Revenue in finance_transactions.
-- Free access grants VIP without creating income.

CREATE OR REPLACE FUNCTION public.psp_admin_manual_vip_v500(p_identifier text, p_action text DEFAULT 'status'::text, p_days integer DEFAULT 30, p_access_type text DEFAULT 'free'::text, p_paid_amount numeric DEFAULT NULL::numeric, p_paid_currency text DEFAULT NULL::text, p_earning_usd numeric DEFAULT NULL::numeric, p_payment_method text DEFAULT NULL::text, p_payment_reference text DEFAULT NULL::text, p_receipt_path text DEFAULT NULL::text, p_operation_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_identifier text:=btrim(coalesce(p_identifier,''));
  v_action text:=lower(btrim(coalesce(p_action,'status')));
  v_access_type text:=lower(btrim(coalesce(p_access_type,'free')));
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
  v_finance_id uuid;
  v_op uuid:=coalesce(p_operation_id,gen_random_uuid());
  v_sub_ref text;
  v_fin_ref text;
  v_current_member_type text;
  v_last_manual_type text;
  v_last_paid_amount numeric;
  v_last_paid_currency text;
  v_last_earning_usd numeric;
  v_last_receipt text;
  v_last_payment_method text;
  v_last_payment_reference text;
  v_is_idempotent boolean:=false;
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
    if v_access_type not in ('free','paid') then
      raise exception 'Access type must be free or paid.';
    end if;

    if v_access_type='paid' then
      if coalesce(p_paid_amount,0)<=0 then raise exception 'Paid amount is required.'; end if;
      if nullif(btrim(coalesce(p_paid_currency,'')),'') is null then raise exception 'Paid currency is required.'; end if;
      if coalesce(p_earning_usd,0)<=0 then raise exception 'Earning amount in USD is required.'; end if;
      if nullif(btrim(coalesce(p_payment_method,'')),'') is null then raise exception 'Payment method is required.'; end if;
      if nullif(btrim(coalesce(p_receipt_path,'')),'') is null then raise exception 'Pay slip / receipt is required for paid access.'; end if;
      if p_receipt_path like '%..%' then raise exception 'Invalid receipt path.'; end if;
      v_sub_ref:='manual-paid:'||v_op::text;
      v_fin_ref:='MANUAL_VIP:'||v_op::text;
    else
      v_sub_ref:='manual-free:'||v_op::text;
    end if;

    select s.id,s.ends_at into v_sub_id,v_end
    from public.subscriptions s
    where s.user_id=v_user.id and s.payment_reference=v_sub_ref
    order by s.created_at desc limit 1;

    if v_sub_id is not null then
      v_is_idempotent:=true;
    else
      select max(s.ends_at) into v_base
      from public.subscriptions s
      join public.subscription_plans sp on sp.id=s.plan_id
      where s.user_id=v_user.id
        and lower(coalesce(s.status,''))='active'
        and (s.ends_at is null or s.ends_at>now())
        and lower(coalesce(sp.member_type,''))='vip';

      v_base:=greatest(now(),coalesce(v_base,now()));
      v_end:=v_base+make_interval(days=>v_days);

      insert into public.subscriptions(
        user_id,plan_id,status,starts_at,ends_at,amount,currency,payment_reference,created_at,updated_at
      ) values(
        v_user.id,v_plan.id,'active',now(),v_end,
        case when v_access_type='paid' then p_earning_usd else 0 end,
        'USD',v_sub_ref,now(),now()
      ) returning id into v_sub_id;
    end if;

    if v_access_type='paid' then
      select ft.id into v_finance_id
      from public.finance_transactions ft
      where ft.source_ref=v_fin_ref
      order by ft.created_at desc limit 1;

      if v_finance_id is null then
        insert into public.finance_transactions(
          transaction_type,direction,category,subcategory,description,
          amount,currency,counterparty,payment_method,status,transaction_date,
          paid_at,receipt_path,source,source_ref,created_by,approved_by,approved_at,metadata
        ) values(
          'income','credit','VIP Access Revenue','Manual Paid VIP',
          format('Manual paid VIP access — %s — %s days',
            coalesce(nullif(v_user.full_name,''),nullif(v_user.email,''),'User'),v_days),
          p_earning_usd,'USD',
          coalesce(nullif(v_user.full_name,''),v_user.email),
          btrim(p_payment_method),'paid',current_date,now(),
          btrim(p_receipt_path),'manual',v_fin_ref,auth.uid(),auth.uid(),now(),
          jsonb_build_object(
            'user_id',v_user.id,
            'client_id',v_user.client_id,
            'email',v_user.email,
            'subscription_id',v_sub_id,
            'manual_access_type','paid',
            'access_days',v_days,
            'paid_amount',p_paid_amount,
            'paid_currency',upper(btrim(p_paid_currency)),
            'earning_usd',p_earning_usd,
            'payment_reference',nullif(btrim(coalesce(p_payment_reference,'')),''),
            'receipt_path',btrim(p_receipt_path),
            'operation_id',v_op
          )
        ) returning id into v_finance_id;
      end if;
    end if;

    perform public.psp_sync_profile_membership_v446(v_user.id);

  elsif v_action='revoke' then
    update public.subscriptions s
       set status='cancelled',
           ends_at=least(coalesce(s.ends_at,now()),now()),
           updated_at=now()
     where s.user_id=v_user.id
       and lower(coalesce(s.status,''))='active'
       and (
         coalesce(s.payment_reference,'') like 'manual-admin:%'
         or coalesce(s.payment_reference,'') like 'manual-free:%'
         or coalesce(s.payment_reference,'') like 'manual-paid:%'
       );
    perform public.psp_sync_profile_membership_v446(v_user.id);

  elsif v_action<>'status' then
    raise exception 'Unsupported action. Use status, grant or revoke.';
  end if;

  select
    max(s.ends_at) filter (
      where lower(coalesce(s.status,''))='active'
        and (s.ends_at is null or s.ends_at>now())
        and (
          coalesce(s.payment_reference,'') like 'manual-admin:%'
          or coalesce(s.payment_reference,'') like 'manual-free:%'
          or coalesce(s.payment_reference,'') like 'manual-paid:%'
        )
    ),
    bool_or(
      lower(coalesce(s.status,''))='active'
      and (s.ends_at is null or s.ends_at>now())
      and (
        coalesce(s.payment_reference,'') like 'manual-admin:%'
        or coalesce(s.payment_reference,'') like 'manual-free:%'
        or coalesce(s.payment_reference,'') like 'manual-paid:%'
      )
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

  select
    case
      when s.payment_reference like 'manual-paid:%' then 'paid'
      when s.payment_reference like 'manual-free:%' then 'free'
      when s.payment_reference like 'manual-admin:%' then 'legacy'
      else null
    end
  into v_last_manual_type
  from public.subscriptions s
  where s.user_id=v_user.id
    and (
      s.payment_reference like 'manual-paid:%'
      or s.payment_reference like 'manual-free:%'
      or s.payment_reference like 'manual-admin:%'
    )
  order by s.created_at desc limit 1;

  select
    (ft.metadata->>'paid_amount')::numeric,
    ft.metadata->>'paid_currency',
    ft.amount,
    ft.receipt_path,
    ft.payment_method,
    ft.metadata->>'payment_reference'
  into v_last_paid_amount,v_last_paid_currency,v_last_earning_usd,
       v_last_receipt,v_last_payment_method,v_last_payment_reference
  from public.finance_transactions ft
  where ft.direction='credit'
    and ft.category='VIP Access Revenue'
    and ft.metadata->>'user_id'=v_user.id::text
  order by ft.created_at desc limit 1;

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
    'last_manual_type',v_last_manual_type,
    'last_paid_amount',v_last_paid_amount,
    'last_paid_currency',v_last_paid_currency,
    'last_earning_usd',v_last_earning_usd,
    'last_receipt_path',v_last_receipt,
    'last_payment_method',v_last_payment_method,
    'last_payment_reference',v_last_payment_reference,
    'days_added',case when v_action='grant' then v_days else null end,
    'access_type',case when v_action='grant' then v_access_type else v_last_manual_type end,
    'subscription_id',v_sub_id,
    'finance_transaction_id',v_finance_id,
    'idempotent',v_is_idempotent,
    'message',case
      when v_action='grant' and v_access_type='paid'
        then format('Paid VIP access added for %s days and $%s added to Earnings.',v_days,p_earning_usd)
      when v_action='grant'
        then format('Free VIP access added for %s days. No Earnings entry was created.',v_days)
      when v_action='revoke'
        then 'Manual VIP access removed. Historical paid Earnings records were kept.'
      else 'VIP access status loaded.'
    end
  );
end;
$function$


REVOKE ALL ON FUNCTION public.psp_admin_manual_vip_v500(text,text,integer,text,numeric,text,numeric,text,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.psp_admin_manual_vip_v500(text,text,integer,text,numeric,text,numeric,text,text,text,uuid) TO authenticated,service_role;
