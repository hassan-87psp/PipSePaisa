-- PipSePaisa V504 — Manual VIP client search, payment-date access, and unregistered sales ledger.


create table if not exists public.psp_manual_vip_sales_v504 (
  id uuid primary key default gen_random_uuid(),
  linked_user_id uuid null references public.profiles(id) on delete set null,
  full_name text not null,
  email text null,
  phone text null,
  whatsapp text null,
  access_days integer not null default 30 check (access_days between 1 and 365),
  payment_date date not null,
  paid_amount numeric not null check (paid_amount > 0),
  paid_currency text not null,
  earning_usd numeric not null check (earning_usd > 0),
  payment_method text not null,
  payment_reference text null,
  receipt_path text not null,
  finance_transaction_id uuid null references public.finance_transactions(id) on delete set null,
  subscription_id uuid null references public.subscriptions(id) on delete set null,
  status text not null default 'unlinked' check (status in ('unlinked','linked','cancelled')),
  notes text null,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.psp_manual_vip_sales_v504 enable row level security;
revoke all on table public.psp_manual_vip_sales_v504 from public,anon,authenticated;
grant all on table public.psp_manual_vip_sales_v504 to service_role;

create index if not exists psp_manual_vip_sales_v504_email_idx
  on public.psp_manual_vip_sales_v504(lower(coalesce(email,'')));
create index if not exists psp_manual_vip_sales_v504_name_idx
  on public.psp_manual_vip_sales_v504(lower(full_name));
create index if not exists psp_manual_vip_sales_v504_status_idx
  on public.psp_manual_vip_sales_v504(status,created_at desc);

CREATE OR REPLACE FUNCTION public.psp_admin_link_manual_vip_sale_v504(p_sale_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  s public.psp_manual_vip_sales_v504%rowtype;
  p public.profiles%rowtype;
  result jsonb;
  sub_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;

  select * into s
  from public.psp_manual_vip_sales_v504 x
  where x.id=p_sale_id
  for update;
  if not found then raise exception 'Saved payment record not found.'; end if;

  select * into p from public.profiles x where x.id=p_user_id;
  if not found then raise exception 'Registered user not found.'; end if;

  result:=public.psp_admin_manual_vip_v504(
    p.id::text,'grant',s.access_days,'paid',
    s.paid_amount,s.paid_currency,s.earning_usd,
    s.payment_method,s.payment_reference,s.receipt_path,
    s.payment_date,s.id
  );

  sub_id:=nullif(result->>'subscription_id','')::uuid;

  update public.psp_manual_vip_sales_v504 x
  set linked_user_id=p.id,
      subscription_id=sub_id,
      status='linked',
      email=coalesce(nullif(x.email,''),p.email),
      phone=coalesce(nullif(x.phone,''),p.phone),
      whatsapp=coalesce(nullif(x.whatsapp,''),p.whatsapp),
      updated_by=auth.uid(),
      updated_at=now()
  where x.id=s.id;

  return jsonb_build_object(
    'ok',true,
    'sale_id',s.id,
    'user_id',p.id,
    'subscription_id',sub_id,
    'access_ends_at',result->>'access_ends_at',
    'message','Payment linked to registered client. No duplicate Earnings entry was created.'
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_admin_manual_vip_v504(p_identifier text, p_action text DEFAULT 'status'::text, p_days integer DEFAULT 30, p_access_type text DEFAULT 'free'::text, p_paid_amount numeric DEFAULT NULL::numeric, p_paid_currency text DEFAULT NULL::text, p_earning_usd numeric DEFAULT NULL::numeric, p_payment_method text DEFAULT NULL::text, p_payment_reference text DEFAULT NULL::text, p_receipt_path text DEFAULT NULL::text, p_payment_date date DEFAULT NULL::date, p_operation_id uuid DEFAULT NULL::uuid)
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
  v_start timestamptz;
  v_end timestamptz;
  v_base timestamptz;
  v_existing_sub_id uuid;
  v_existing_end timestamptz;
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
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;
  if v_identifier='' then raise exception 'Select a user first.'; end if;

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
  if not found then raise exception 'User not found. Search and select the client first.'; end if;

  select sp.* into v_plan
  from public.subscription_plans sp
  where sp.is_active=true
    and sp.is_official=true
    and lower(coalesce(sp.member_type,''))='vip'
  order by sp.display_order nulls last,sp.created_at asc
  limit 1;
  if not found then raise exception 'Official VIP plan is not configured.'; end if;

  if v_action='grant' then
    if v_access_type not in ('free','paid') then raise exception 'Access type must be free or paid.'; end if;

    if v_access_type='paid' then
      if p_payment_date is null then raise exception 'Payment slip date is required.'; end if;
      if p_payment_date>current_date then raise exception 'Payment slip date cannot be in the future.'; end if;
      if coalesce(p_paid_amount,0)<=0 then raise exception 'Paid amount is required.'; end if;
      if nullif(btrim(coalesce(p_paid_currency,'')),'') is null then raise exception 'Paid currency is required.'; end if;
      if coalesce(p_earning_usd,0)<=0 then raise exception 'Earning amount in USD is required.'; end if;
      if nullif(btrim(coalesce(p_payment_method,'')),'') is null then raise exception 'Payment method is required.'; end if;
      if nullif(btrim(coalesce(p_receipt_path,'')),'') is null then raise exception 'Pay slip / receipt is required for paid access.'; end if;

      v_start:=p_payment_date::timestamptz;
      v_end:=(p_payment_date+v_days)::timestamptz;
      v_sub_ref:='manual-paid:'||v_op::text;
      v_fin_ref:='MANUAL_VIP:'||v_op::text;
    else
      select max(s.ends_at) into v_base
      from public.subscriptions s
      join public.subscription_plans sp on sp.id=s.plan_id
      where s.user_id=v_user.id
        and lower(coalesce(s.status,''))='active'
        and (s.ends_at is null or s.ends_at>now())
        and lower(coalesce(sp.member_type,''))='vip';

      v_start:=now();
      v_base:=greatest(now(),coalesce(v_base,now()));
      v_end:=v_base+make_interval(days=>v_days);
      v_sub_ref:='manual-free:'||v_op::text;
    end if;

    select s.id,s.ends_at into v_existing_sub_id,v_existing_end
    from public.subscriptions s
    where s.user_id=v_user.id and s.payment_reference=v_sub_ref
    order by s.created_at desc limit 1;

    if v_existing_sub_id is not null then
      v_sub_id:=v_existing_sub_id;
      v_end:=v_existing_end;
    else
      insert into public.subscriptions(
        user_id,plan_id,status,starts_at,ends_at,amount,currency,payment_reference,created_at,updated_at
      ) values(
        v_user.id,v_plan.id,
        case when v_end>now() then 'active' else 'expired' end,
        v_start,v_end,
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
          format('Manual paid VIP access — %s — %s days from %s',
            coalesce(nullif(v_user.full_name,''),nullif(v_user.email,''),'User'),
            v_days,to_char(p_payment_date,'YYYY-MM-DD')),
          p_earning_usd,'USD',
          coalesce(nullif(v_user.full_name,''),v_user.email),
          btrim(p_payment_method),'paid',p_payment_date,p_payment_date::timestamptz,
          btrim(p_receipt_path),'manual',v_fin_ref,auth.uid(),auth.uid(),now(),
          jsonb_build_object(
            'user_id',v_user.id,
            'client_id',v_user.client_id,
            'email',v_user.email,
            'subscription_id',v_sub_id,
            'manual_access_type','paid',
            'access_days',v_days,
            'payment_date',p_payment_date,
            'access_starts_at',v_start,
            'access_ends_at',v_end,
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
      where lower(coalesce(s.status,''))='active' and (s.ends_at is null or s.ends_at>now())
    ),
    bool_or(
      lower(coalesce(s.status,''))='active' and (s.ends_at is null or s.ends_at>now())
    )
  into v_manual_end,v_manual_active,v_overall_end,v_overall_active
  from public.subscriptions s
  join public.subscription_plans sp on sp.id=s.plan_id
  where s.user_id=v_user.id and lower(coalesce(sp.member_type,''))='vip';

  select p.member_type into v_current_member_type
  from public.profiles p where p.id=v_user.id;

  return jsonb_build_object(
    'ok',true,
    'action',v_action,
    'user_id',v_user.id,
    'client_id',v_user.client_id,
    'full_name',v_user.full_name,
    'email',v_user.email,
    'phone',v_user.phone,
    'whatsapp',v_user.whatsapp,
    'manual_active',coalesce(v_manual_active,false),
    'manual_expires_at',v_manual_end,
    'vip_active',coalesce(v_overall_active,false),
    'vip_expires_at',v_overall_end,
    'member_type',coalesce(v_current_member_type,'free'),
    'days_added',case when v_action='grant' then v_days else null end,
    'access_type',case when v_action='grant' then v_access_type else null end,
    'subscription_id',v_sub_id,
    'finance_transaction_id',v_finance_id,
    'access_starts_at',v_start,
    'access_ends_at',v_end,
    'message',case
      when v_action='grant' and v_access_type='paid'
        then format('Paid VIP access added from %s to %s and $%s added to Earnings.',
          to_char(p_payment_date,'YYYY-MM-DD'),to_char(v_end::date,'YYYY-MM-DD'),p_earning_usd)
      when v_action='grant'
        then format('Free VIP access added for %s days. No Earnings entry was created.',v_days)
      when v_action='revoke'
        then 'Manual VIP access removed. Historical paid Earnings records were kept.'
      else 'VIP access status loaded.'
    end
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_admin_save_manual_vip_sale_v504(p_sale_id uuid DEFAULT NULL::uuid, p_full_name text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_whatsapp text DEFAULT NULL::text, p_access_days integer DEFAULT 30, p_payment_date date DEFAULT NULL::date, p_paid_amount numeric DEFAULT NULL::numeric, p_paid_currency text DEFAULT NULL::text, p_earning_usd numeric DEFAULT NULL::numeric, p_payment_method text DEFAULT NULL::text, p_payment_reference text DEFAULT NULL::text, p_receipt_path text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id uuid:=coalesce(p_sale_id,gen_random_uuid());
  v_days integer:=greatest(1,least(coalesce(p_access_days,30),365));
  v_finance_id uuid;
  v_existing public.psp_manual_vip_sales_v504%rowtype;
  v_is_new boolean:=true;
  v_email text:=nullif(lower(btrim(coalesce(p_email,''))),'');
  v_phone text:=nullif(btrim(coalesce(p_phone,'')),'');
  v_wa text:=nullif(btrim(coalesce(p_whatsapp,'')),'');
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;
  if nullif(btrim(coalesce(p_full_name,'')),'') is null then raise exception 'Client name is required.'; end if;
  if p_payment_date is null then raise exception 'Payment slip date is required.'; end if;
  if p_payment_date>current_date then raise exception 'Payment slip date cannot be in the future.'; end if;
  if coalesce(p_paid_amount,0)<=0 then raise exception 'Paid amount is required.'; end if;
  if nullif(btrim(coalesce(p_paid_currency,'')),'') is null then raise exception 'Paid currency is required.'; end if;
  if coalesce(p_earning_usd,0)<=0 then raise exception 'Earning amount in USD is required.'; end if;
  if nullif(btrim(coalesce(p_payment_method,'')),'') is null then raise exception 'Payment method is required.'; end if;
  if nullif(btrim(coalesce(p_receipt_path,'')),'') is null then raise exception 'Pay slip / receipt is required.'; end if;

  if p_sale_id is not null then
    select * into v_existing
    from public.psp_manual_vip_sales_v504 s
    where s.id=v_id
    for update;
    if found then v_is_new:=false; end if;
  end if;

  if v_is_new then
    insert into public.finance_transactions(
      transaction_type,direction,category,subcategory,description,
      amount,currency,counterparty,payment_method,status,transaction_date,
      paid_at,receipt_path,source,source_ref,created_by,approved_by,approved_at,metadata
    ) values(
      'income','credit','VIP Access Revenue','Unregistered Manual Paid VIP',
      format('VIP payment saved before account registration — %s — %s days from %s',
        btrim(p_full_name),v_days,to_char(p_payment_date,'YYYY-MM-DD')),
      p_earning_usd,'USD',btrim(p_full_name),btrim(p_payment_method),'paid',
      p_payment_date,p_payment_date::timestamptz,btrim(p_receipt_path),
      'manual','MANUAL_VIP:'||v_id::text,auth.uid(),auth.uid(),now(),
      jsonb_build_object(
        'manual_sale_id',v_id,
        'manual_access_type','paid-unregistered',
        'full_name',btrim(p_full_name),
        'email',v_email,
        'phone',v_phone,
        'whatsapp',v_wa,
        'access_days',v_days,
        'payment_date',p_payment_date,
        'paid_amount',p_paid_amount,
        'paid_currency',upper(btrim(p_paid_currency)),
        'earning_usd',p_earning_usd,
        'payment_reference',nullif(btrim(coalesce(p_payment_reference,'')),''),
        'receipt_path',btrim(p_receipt_path)
      )
    ) returning id into v_finance_id;

    insert into public.psp_manual_vip_sales_v504(
      id,full_name,email,phone,whatsapp,access_days,payment_date,
      paid_amount,paid_currency,earning_usd,payment_method,payment_reference,
      receipt_path,finance_transaction_id,status,notes,created_by,updated_by
    ) values(
      v_id,btrim(p_full_name),v_email,v_phone,v_wa,v_days,p_payment_date,
      p_paid_amount,upper(btrim(p_paid_currency)),p_earning_usd,btrim(p_payment_method),
      nullif(btrim(coalesce(p_payment_reference,'')),''),btrim(p_receipt_path),
      v_finance_id,'unlinked',nullif(btrim(coalesce(p_notes,'')),''),auth.uid(),auth.uid()
    );
  else
    update public.psp_manual_vip_sales_v504 s
    set full_name=btrim(p_full_name),
        email=v_email,
        phone=v_phone,
        whatsapp=v_wa,
        access_days=v_days,
        payment_date=p_payment_date,
        paid_amount=p_paid_amount,
        paid_currency=upper(btrim(p_paid_currency)),
        earning_usd=p_earning_usd,
        payment_method=btrim(p_payment_method),
        payment_reference=nullif(btrim(coalesce(p_payment_reference,'')),''),
        receipt_path=btrim(p_receipt_path),
        notes=nullif(btrim(coalesce(p_notes,'')),''),
        updated_by=auth.uid(),
        updated_at=now()
    where s.id=v_id;
    v_finance_id:=v_existing.finance_transaction_id;
  end if;

  return (
    select jsonb_build_object(
      'ok',true,
      'sale_id',s.id,
      'status',s.status,
      'linked_user_id',s.linked_user_id,
      'full_name',s.full_name,
      'email',s.email,
      'phone',s.phone,
      'whatsapp',s.whatsapp,
      'payment_date',s.payment_date,
      'access_days',s.access_days,
      'access_ends_on',s.payment_date+s.access_days,
      'paid_amount',s.paid_amount,
      'paid_currency',s.paid_currency,
      'earning_usd',s.earning_usd,
      'payment_method',s.payment_method,
      'payment_reference',s.payment_reference,
      'receipt_path',s.receipt_path,
      'finance_transaction_id',s.finance_transaction_id,
      'subscription_id',s.subscription_id,
      'message',case when v_is_new
        then 'Payment saved. Client can be linked later without creating duplicate Earnings.'
        else 'Saved payment details updated.'
      end
    )
    from public.psp_manual_vip_sales_v504 s
    where s.id=v_id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_admin_search_manual_vip_sales_v504(p_query text DEFAULT ''::text, p_limit integer DEFAULT 20)
 RETURNS TABLE(sale_id uuid, status text, linked_user_id uuid, full_name text, email text, phone text, whatsapp text, payment_date date, access_days integer, paid_amount numeric, paid_currency text, earning_usd numeric, payment_method text, payment_reference text, receipt_path text, finance_transaction_id uuid, subscription_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  q text:=lower(btrim(coalesce(p_query,'')));
  qdigits text:=regexp_replace(coalesce(p_query,''),'[^0-9]','','g');
  lim integer:=greatest(1,least(coalesce(p_limit,20),50));
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;

  return query
  select
    s.id,s.status,s.linked_user_id,s.full_name,s.email,s.phone,s.whatsapp,
    s.payment_date,s.access_days,s.paid_amount,s.paid_currency,s.earning_usd,
    s.payment_method,s.payment_reference,s.receipt_path,s.finance_transaction_id,
    s.subscription_id,s.created_at,s.updated_at
  from public.psp_manual_vip_sales_v504 s
  where s.status<>'cancelled'
    and (
      q='' or
      lower(coalesce(s.full_name,'')) like '%'||q||'%' or
      lower(coalesce(s.email,'')) like '%'||q||'%' or
      lower(coalesce(s.payment_reference,'')) like '%'||q||'%' or
      (length(qdigits)>=4 and (
        regexp_replace(coalesce(s.phone,''),'[^0-9]','','g') like '%'||qdigits||'%'
        or regexp_replace(coalesce(s.whatsapp,''),'[^0-9]','','g') like '%'||qdigits||'%'
      ))
    )
  order by case when s.status='unlinked' then 0 else 1 end,s.updated_at desc
  limit lim;
end;
$function$;

CREATE OR REPLACE FUNCTION public.psp_admin_search_manual_vip_users_v504(p_query text, p_limit integer DEFAULT 12)
 RETURNS TABLE(user_id uuid, client_id text, full_name text, email text, phone text, whatsapp text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  q text:=btrim(coalesce(p_query,''));
  ql text:=lower(btrim(coalesce(p_query,'')));
  qdigits text:=regexp_replace(coalesce(p_query,''),'[^0-9]','','g');
  lim integer:=greatest(1,least(coalesce(p_limit,12),25));
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;
  if length(q)<2 then return; end if;

  return query
  select p.id,p.client_id,p.full_name,p.email,p.phone,p.whatsapp
  from public.profiles p
  where
       p.id::text=q
    or lower(coalesce(p.email,''))=ql
    or lower(coalesce(p.client_id,''))=ql
    or lower(coalesce(p.full_name,''))=ql
    or lower(coalesce(p.email,'')) like '%'||ql||'%'
    or lower(coalesce(p.client_id,'')) like '%'||ql||'%'
    or lower(coalesce(p.full_name,'')) like '%'||ql||'%'
    or (
      length(qdigits)>=4 and (
        regexp_replace(coalesce(p.phone,''),'[^0-9]','','g') like '%'||qdigits||'%'
        or regexp_replace(coalesce(p.whatsapp,''),'[^0-9]','','g') like '%'||qdigits||'%'
      )
    )
  order by
    case
      when p.id::text=q then 0
      when lower(coalesce(p.email,''))=ql then 1
      when lower(coalesce(p.client_id,''))=ql then 2
      when length(qdigits)>=4 and regexp_replace(coalesce(p.whatsapp,''),'[^0-9]','','g')=qdigits then 3
      when length(qdigits)>=4 and regexp_replace(coalesce(p.phone,''),'[^0-9]','','g')=qdigits then 4
      when lower(coalesce(p.full_name,''))=ql then 5
      when lower(coalesce(p.full_name,'')) like ql||'%' then 6
      else 7
    end,
    p.created_at desc
  limit lim;
end;
$function$;

revoke all on function public.psp_admin_search_manual_vip_users_v504(text,integer) from public,anon;
grant execute on function public.psp_admin_search_manual_vip_users_v504(text,integer) to authenticated,service_role;

revoke all on function public.psp_admin_manual_vip_v504(text,text,integer,text,numeric,text,numeric,text,text,text,date,uuid) from public,anon;
grant execute on function public.psp_admin_manual_vip_v504(text,text,integer,text,numeric,text,numeric,text,text,text,date,uuid) to authenticated,service_role;

revoke all on function public.psp_admin_save_manual_vip_sale_v504(uuid,text,text,text,text,integer,date,numeric,text,numeric,text,text,text,text) from public,anon;
grant execute on function public.psp_admin_save_manual_vip_sale_v504(uuid,text,text,text,text,integer,date,numeric,text,numeric,text,text,text,text) to authenticated,service_role;

revoke all on function public.psp_admin_search_manual_vip_sales_v504(text,integer) from public,anon;
grant execute on function public.psp_admin_search_manual_vip_sales_v504(text,integer) to authenticated,service_role;

revoke all on function public.psp_admin_link_manual_vip_sale_v504(uuid,uuid) from public,anon;
grant execute on function public.psp_admin_link_manual_vip_sale_v504(uuid,uuid) to authenticated,service_role;
