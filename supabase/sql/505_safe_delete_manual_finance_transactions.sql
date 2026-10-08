-- PipSePaisa V505 — safe permanent delete for manual finance transactions.


CREATE OR REPLACE FUNCTION public.psp_admin_delete_finance_transaction_v505(
  p_transaction_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_tx public.finance_transactions%rowtype;
  v_sale public.psp_manual_vip_sales_v504%rowtype;
  v_token text;
  v_user_id uuid;
  v_cancelled_subs integer:=0;
  v_sale_deleted boolean:=false;
  v_receipt text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;
  if not public.psp_finance_is_admin() then
    raise exception 'Finance admin access required.';
  end if;

  select * into v_tx
  from public.finance_transactions t
  where t.id=p_transaction_id
  for update;

  if not found then
    raise exception 'Transaction not found.';
  end if;

  if lower(coalesce(v_tx.source,'')) not in ('manual','adjustment') then
    raise exception 'Automatic/system transactions cannot be deleted.';
  end if;

  if exists(
    select 1 from public.finance_month_closures c
    where c.period_month=date_trunc('month',v_tx.transaction_date)::date
  ) then
    raise exception 'This finance month is closed. Reopen/correct the month before deleting transactions.';
  end if;

  v_receipt:=v_tx.receipt_path;

  if v_tx.category='VIP Access Revenue'
     and coalesce(v_tx.source_ref,'') like 'MANUAL_VIP:%'
  then
    v_token:=split_part(v_tx.source_ref,':',2);

    select * into v_sale
    from public.psp_manual_vip_sales_v504 s
    where s.finance_transaction_id=v_tx.id
       or s.id::text=v_token
    order by case when s.finance_transaction_id=v_tx.id then 0 else 1 end
    limit 1
    for update;

    if found then
      v_user_id:=v_sale.linked_user_id;

      if v_sale.subscription_id is not null then
        update public.subscriptions s
        set status='cancelled',
            ends_at=least(coalesce(s.ends_at,now()),now()),
            updated_at=now()
        where s.id=v_sale.subscription_id
          and lower(coalesce(s.status,''))='active';
        get diagnostics v_cancelled_subs=row_count;
      end if;

      delete from public.psp_manual_vip_sales_v504
      where id=v_sale.id;
      v_sale_deleted:=true;
    else
      update public.subscriptions s
      set status='cancelled',
          ends_at=least(coalesce(s.ends_at,now()),now()),
          updated_at=now()
      where s.payment_reference='manual-paid:'||v_token
        and lower(coalesce(s.status,''))='active';
      get diagnostics v_cancelled_subs=row_count;

      begin
        if nullif(v_tx.metadata->>'user_id','') is not null
           and (v_tx.metadata->>'user_id') ~* '^[0-9a-f-]{36}$'
        then
          v_user_id:=(v_tx.metadata->>'user_id')::uuid;
        end if;
      exception when others then
        v_user_id:=null;
      end;
    end if;
  end if;

  delete from public.finance_transactions
  where id=v_tx.id;

  if v_user_id is not null then
    perform public.psp_sync_profile_membership_v446(v_user_id);
  end if;

  return jsonb_build_object(
    'ok',true,
    'transaction_id',v_tx.id,
    'txn_code',v_tx.txn_code,
    'category',v_tx.category,
    'receipt_path',v_receipt,
    'vip_access_cancelled',v_cancelled_subs>0,
    'manual_sale_deleted',v_sale_deleted,
    'message',case
      when v_cancelled_subs>0
        then 'Transaction deleted and linked manual VIP access cancelled.'
      when v_sale_deleted
        then 'Transaction and saved manual VIP payment record deleted.'
      else 'Transaction deleted.'
    end
  );
end;
$function$;

REVOKE ALL ON FUNCTION public.psp_admin_delete_finance_transaction_v505(uuid)
  FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.psp_admin_delete_finance_transaction_v505(uuid)
  TO authenticated,service_role;
