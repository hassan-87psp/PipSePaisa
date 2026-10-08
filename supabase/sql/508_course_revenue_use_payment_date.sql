-- PipSePaisa V508 — course revenue follows actual/manual payment date.


create or replace function public.psp_finance_sync_course_revenue_v179(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  r public.course_enrollments%rowtype;
  v_ref text;
  v_original_date date;
  v_date date;
  v_month date;
  v_closed boolean:=false;
  v_existing public.finance_transactions%rowtype;
begin
  select * into r from public.course_enrollments where id=p_id;
  if not found then return false; end if;

  v_ref:='COURSE:'||r.id::text;

  v_original_date:=coalesce(
    r.manual_payment_date,
    r.access_granted_at::date,
    r.reviewed_at::date,
    r.updated_at::date,
    r.created_at::date,
    current_date
  );
  v_date:=v_original_date;
  v_month:=date_trunc('month',v_date)::date;

  select exists(
    select 1 from public.finance_month_closures where period_month=v_month
  ) into v_closed;

  if v_closed then
    v_date:=current_date;
    v_month:=date_trunc('month',current_date)::date;
  end if;

  if lower(coalesce(r.course_type,''))='paid'
     and lower(coalesce(r.payment_status,''))='approved'
     and lower(coalesce(r.enrollment_status,''))='enrolled'
     and coalesce(r.price,0)>0 then

    insert into public.finance_transactions(
      transaction_type,direction,category,subcategory,description,amount,currency,
      payment_method,status,transaction_date,period_month,paid_at,source,source_ref,metadata
    ) values(
      'income','credit','Paid Course Revenue',coalesce(r.course_name,'Course'),
      coalesce(r.full_name,r.email,'Student'),
      round(r.price::numeric,2),coalesce(r.currency,'USD'),
      coalesce(r.payment_method,'Course Payment'),
      'paid',v_date,v_month,v_date::timestamptz,
      'automatic',v_ref,
      jsonb_build_object(
        'enrollment_id',r.id,
        'student_email',r.email,
        'transaction_id',r.transaction_id,
        'original_payment_date',v_original_date,
        'late_post_from_closed_month',v_closed
      )
    )
    on conflict(source_ref) where source_ref is not null do update set
      amount=excluded.amount,
      currency=excluded.currency,
      payment_method=excluded.payment_method,
      status='paid',
      description=excluded.description,
      subcategory=excluded.subcategory,
      transaction_date=excluded.transaction_date,
      period_month=excluded.period_month,
      paid_at=excluded.paid_at,
      metadata=excluded.metadata,
      updated_at=now();

    return true;
  end if;

  select * into v_existing
  from public.finance_transactions
  where source_ref=v_ref and source='automatic'
  limit 1;

  if found then
    select exists(
      select 1 from public.finance_month_closures where period_month=v_existing.period_month
    ) into v_closed;

    if not v_closed then
      delete from public.finance_transactions where id=v_existing.id;
    else
      insert into public.finance_transactions(
        transaction_type,direction,category,description,amount,currency,status,
        transaction_date,period_month,source,source_ref,metadata
      ) values(
        'adjustment','debit','Course Revenue Reversal',
        'Closed-month reversal for '||coalesce(r.course_name,'course'),
        v_existing.amount,v_existing.currency,'paid',
        current_date,date_trunc('month',current_date)::date,
        'adjustment','COURSE-REVERSAL:'||r.id::text,
        jsonb_build_object(
          'original_source_ref',v_ref,
          'original_period_month',v_existing.period_month
        )
      )
      on conflict(source_ref) where source_ref is not null do nothing;
    end if;
  end if;

  return false;
end;
$function$;

do $$
declare x record;
begin
  for x in
    select id
    from public.course_enrollments
    where lower(coalesce(course_type,''))='paid'
      and lower(coalesce(payment_status,''))='approved'
      and lower(coalesce(enrollment_status,''))='enrolled'
      and coalesce(price,0)>0
  loop
    perform public.psp_finance_sync_course_revenue_v179(x.id);
  end loop;
end $$;
