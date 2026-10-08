-- PipSePaisa V507 — course-specific partner payout basis.


alter table public.finance_partners
  add column if not exists course_key text null;

update public.finance_partners
set course_key='advanced',
    updated_at=now()
where lower(partner_name)='sajid bhai'
  and share_basis='course_revenue';

create or replace function public.psp_finance_sync_partner_payouts(p_month date)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  p record;
  v_month date:=date_trunc('month',p_month)::date;
  v_income numeric:=0;
  v_debits numeric:=0;
  v_course numeric:=0;
  v_basis numeric:=0;
  v_due numeric:=0;
  v_count int:=0;
begin
  if not public.psp_finance_is_admin() then
    raise exception 'Admin access required.';
  end if;

  select
    coalesce(sum(case when direction='credit' and status in ('approved','paid') then amount else 0 end),0),
    coalesce(sum(case when direction='debit' and status in ('approved','paid') and transaction_type<>'partner_payout' then amount else 0 end),0),
    coalesce(sum(case when direction='credit' and status in ('approved','paid') and (category='Paid Course Revenue' or source_ref like 'COURSE:%') then amount else 0 end),0)
  into v_income,v_debits,v_course
  from public.finance_transactions
  where period_month=v_month
    and status not in ('cancelled','rejected');

  for p in select * from public.finance_partners where active=true loop
    if p.share_basis='course_revenue' then
      if nullif(trim(coalesce(p.course_key,'')),'') is not null then
        select coalesce(sum(ft.amount),0)
        into v_basis
        from public.finance_transactions ft
        left join public.course_enrollments ce
          on ce.id::text=coalesce(
            nullif(ft.metadata->>'enrollment_id',''),
            case when ft.source_ref like 'COURSE:%' then split_part(ft.source_ref,':',2) end
          )
        where ft.period_month=v_month
          and ft.direction='credit'
          and ft.status in ('approved','paid')
          and (ft.category='Paid Course Revenue' or ft.source_ref like 'COURSE:%')
          and ce.course_key=p.course_key;
      else
        v_basis:=v_course;
      end if;

    elsif p.share_basis='income_category' then
      select coalesce(sum(amount),0)
      into v_basis
      from public.finance_transactions
      where period_month=v_month
        and direction='credit'
        and status in ('approved','paid')
        and category=coalesce(p.income_category,'');

    else
      v_basis:=greatest(v_income-v_debits,0);
    end if;

    v_due:=round(v_basis*(coalesce(p.share_percent,0)/100.0),2);

    insert into public.finance_partner_payouts(
      partner_id,period_month,basis_amount,share_percent,amount_due,status,due_date
    )
    values(
      p.id,v_month,v_basis,p.share_percent,v_due,
      case when v_due<=0 then 'paid' else 'pending' end,
      (v_month+interval '1 month - 1 day')::date
    )
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
