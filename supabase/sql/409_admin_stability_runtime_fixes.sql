-- V409 Admin stability/runtime fixes
-- 1) Fix Admin Users directory after profiles.is_banned was replaced by profiles.is_active.
-- 2) Allow signed-in admins (not anon users) to run Finance preparation RPCs.

create or replace function public.psp_admin_user_directory()
returns table(
  id uuid, full_name text, email text, whatsapp text, role text,
  is_premium boolean, is_banned boolean, created_at timestamptz,
  email_verified boolean, email_confirmed_at timestamptz,
  referral_name text, referral_slug text, referral_source text, referral_campaign text,
  access_pin text, access_status text, grace_expires_at timestamptz, activated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not public.psp_is_admin() then
    raise exception 'Admin access required.';
  end if;

  perform public.psp_admin_ensure_access_pins();

  return query
  select
    p.id,
    coalesce(nullif(btrim(p.full_name),''), split_part(coalesce(p.email,au.email,'User'),'@',1))::text,
    coalesce(nullif(p.email,''),au.email)::text,
    coalesce(
      nullif(btrim(coalesce(p.whatsapp,'')),''),
      nullif(btrim(coalesce(au.raw_user_meta_data->>'whatsapp','')),''),
      nullif(btrim(coalesce(au.raw_user_meta_data->>'phone','')),'')
    )::text,
    coalesce(p.role::text,'user')::text,
    coalesce(p.is_premium,false),
    (not coalesce(p.is_active,true)),
    coalesce(p.created_at,au.created_at),
    (au.email_confirmed_at is not null),
    au.email_confirmed_at,
    coalesce(event_link.name,meta_link.name)::text,
    coalesce(event_link.slug,meta_link.slug)::text,
    coalesce(event_link.source,meta_link.source)::text,
    coalesce(event_link.campaign,meta_link.campaign)::text,
    pin.access_pin::text,
    case
      when pin.status='active' then 'active'
      when pin.status='locked' then 'locked'
      when pin.grace_expires_at is not null and now() >= pin.grace_expires_at then 'locked'
      else coalesce(pin.status,'pending')
    end::text,
    pin.grace_expires_at,
    pin.activated_at
  from public.profiles p
  left join auth.users au on au.id=p.id
  left join public.user_access_pins pin on pin.user_id=p.id
  left join lateral (
    select l.name,l.slug,l.source,l.campaign
    from public.tracked_link_events e
    join public.tracked_links l on l.id=e.link_id
    where e.user_id=p.id and e.event_type='signup'
    order by e.created_at asc
    limit 1
  ) event_link on true
  left join lateral (
    select l.name,l.slug,l.source,l.campaign
    from public.tracked_links l
    where lower(l.slug)=lower(coalesce(
      au.raw_user_meta_data->>'referral_slug',
      au.raw_user_meta_data->>'pending_course_referral_slug',
      ''
    ))
    limit 1
  ) meta_link on event_link.name is null
  order by coalesce(p.created_at,au.created_at) desc;
end;
$function$;

create or replace function public.psp_finance_prepare_salaries(p_month date)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare r record; v_count int:=0; v_month date:=date_trunc('month',p_month)::date; v_due date;
begin
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;
  for r in select * from public.finance_staff where active=true and monthly_salary>0 loop
    v_due:=v_month + (least(greatest(coalesce(r.due_day,1),1),28)-1);
    insert into public.finance_salary_runs(staff_id,period_month,base_salary,bonus,deduction,advance,payable_amount,status,due_date)
    values(r.id,v_month,r.monthly_salary,coalesce(r.bonus_default,0),coalesce(r.deduction_default,0),0,
      greatest(r.monthly_salary+coalesce(r.bonus_default,0)-coalesce(r.deduction_default,0),0),'pending',v_due)
    on conflict(staff_id,period_month) do nothing;
    if found then v_count:=v_count+1; end if;
  end loop;
  return v_count;
end;
$function$;

create or replace function public.psp_finance_generate_recurring(p_month date)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare r record; v_count int:=0; v_month date:=date_trunc('month',p_month)::date; v_date date; v_ref text;
begin
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;
  for r in select * from public.finance_recurring_items where active=true loop
    v_date:=v_month+(least(greatest(coalesce(r.due_day,1),1),28)-1);
    v_ref:='RECUR:'||r.id::text||':'||to_char(v_month,'YYYY-MM');
    insert into public.finance_transactions(transaction_type,direction,category,description,amount,currency,account_id,counterparty,payment_method,status,transaction_date,due_date,source,source_ref,recurring_item_id,created_by)
    values(case when r.item_type='income' then 'income' else 'expense' end,
      case when r.item_type='income' then 'credit' else 'debit' end,r.category,r.title,r.amount,r.currency,r.account_id,r.counterparty,r.payment_method,
      'pending',v_date,v_date,'recurring',v_ref,r.id,auth.uid())
    on conflict(source_ref) where source_ref is not null do nothing;
    if found then v_count:=v_count+1; end if;
  end loop;
  return v_count;
end;
$function$;

create or replace function public.psp_finance_sync_partner_payouts(p_month date)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare p record; v_month date:=date_trunc('month',p_month)::date; v_income numeric:=0; v_debits numeric:=0; v_course numeric:=0; v_basis numeric:=0; v_due numeric:=0; v_count int:=0;
begin
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;

  select coalesce(sum(case when direction='credit' and status in ('approved','paid') then amount else 0 end),0),
         coalesce(sum(case when direction='debit' and status in ('approved','paid') and transaction_type<>'partner_payout' then amount else 0 end),0),
         coalesce(sum(case when direction='credit' and status in ('approved','paid') and (category='Paid Course Revenue' or source_ref like 'COURSE:%') then amount else 0 end),0)
    into v_income,v_debits,v_course
  from public.finance_transactions
  where period_month=v_month and status not in ('cancelled','rejected');

  for p in select * from public.finance_partners where active=true loop
    if p.share_basis='course_revenue' then v_basis:=v_course;
    elsif p.share_basis='income_category' then
      select coalesce(sum(amount),0) into v_basis
      from public.finance_transactions
      where period_month=v_month and direction='credit' and status in ('approved','paid') and category=coalesce(p.income_category,'');
    else
      v_basis:=greatest(v_income-v_debits,0);
    end if;

    v_due:=round(v_basis*(coalesce(p.share_percent,0)/100.0),2);
    insert into public.finance_partner_payouts(partner_id,period_month,basis_amount,share_percent,amount_due,status,due_date)
    values(p.id,v_month,v_basis,p.share_percent,v_due,case when v_due<=0 then 'paid' else 'pending' end,(v_month+interval '1 month - 1 day')::date)
    on conflict(partner_id,period_month) do update set
      basis_amount=excluded.basis_amount,
      share_percent=excluded.share_percent,
      amount_due=excluded.amount_due,
      status=case
        when public.finance_partner_payouts.amount_paid>=excluded.amount_due then 'paid'
        when public.finance_partner_payouts.amount_paid>0 then 'partial'
        else case when excluded.amount_due<=0 then 'paid' else 'pending' end
      end,
      updated_at=now();
    v_count:=v_count+1;
  end loop;
  return v_count;
end;
$function$;

revoke execute on function public.psp_finance_prepare_salaries(date) from public, anon;
revoke execute on function public.psp_finance_generate_recurring(date) from public, anon;
revoke execute on function public.psp_finance_sync_partner_payouts(date) from public, anon;
grant execute on function public.psp_finance_prepare_salaries(date) to authenticated, service_role;
grant execute on function public.psp_finance_generate_recurring(date) to authenticated, service_role;
grant execute on function public.psp_finance_sync_partner_payouts(date) to authenticated, service_role;
