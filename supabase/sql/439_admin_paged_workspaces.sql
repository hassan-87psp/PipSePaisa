-- Admin pages return the data required to display the selected view in one request.
create or replace function public.psp_admin_users_page_v439(
  p_search text default null,
  p_role text default 'all',
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_offset integer default 0,
  p_limit integer default 100
)
returns jsonb
language plpgsql stable security invoker set search_path = ''
as $function$
declare result jsonb;
begin
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;
  with directory as materialized (
    select d.*,
      case when regexp_replace(lower(coalesce(d.role,'user')), '[[:space:]-]+', '_', 'g') in ('superadmin','super_admin','owner','admin') then 'admin'
        when regexp_replace(lower(coalesce(d.role,'user')), '[[:space:]-]+', '_', 'g') in ('pspmentor','psp_mentor','mentor') then 'mentor'
        else 'user' end as role_key
    from public.psp_admin_user_directory_v413() d
  ), filtered as materialized (
    select * from directory d
    where (coalesce(p_role,'all')='all' or d.role_key=p_role)
      and (p_from is null or d.created_at>=p_from)
      and (p_to is null or d.created_at<=p_to)
      and (nullif(btrim(p_search),'') is null or strpos(lower(concat_ws(' ',d.full_name,d.email,d.whatsapp,d.referral_name,d.referral_slug,d.referral_source,d.referral_campaign,d.client_id)),lower(btrim(p_search)))>0)
  ), page as (
    select * from filtered order by created_at desc nulls last,id
    offset greatest(coalesce(p_offset,0),0) limit least(greatest(coalesce(p_limit,100),1),100)
  )
  select jsonb_build_object(
    'rows',coalesce((select jsonb_agg(to_jsonb(p)-'role_key' order by p.created_at desc nulls last,p.id) from page p),'[]'::jsonb),
    'filtered_total',(select count(*) from filtered),
    'totals',(select jsonb_build_object('all',count(*),'premium',count(*) filter(where is_premium),'free',count(*) filter(where not is_premium),'banned',count(*) filter(where is_banned)) from directory)
  ) into result;
  return result;
end;
$function$;
revoke all on function public.psp_admin_users_page_v439(text,text,timestamptz,timestamptz,integer,integer) from public,anon;
grant execute on function public.psp_admin_users_page_v439(text,text,timestamptz,timestamptz,integer,integer) to authenticated,service_role;

create or replace function public.psp_admin_finance_workspace_v439(
  p_month date default current_date,
  p_prepare boolean default false,
  p_audit boolean default false
)
returns jsonb
language plpgsql security invoker set search_path = ''
as $function$
declare
  m date:=date_trunc('month',coalesce(p_month,current_date))::date;
  first_month date:=(date_trunc('month',coalesce(p_month,current_date))-interval '11 months')::date;
  next_month date:=(date_trunc('month',coalesce(p_month,current_date))+interval '1 month')::date;
  result jsonb;
begin
  if not public.psp_finance_is_admin() then raise exception 'Admin access required.'; end if;
  if p_prepare then
    perform public.psp_finance_prepare_salaries(m);
    perform public.psp_finance_generate_recurring(m);
    perform public.psp_finance_sync_partner_payouts(m);
  end if;
  select jsonb_build_object(
    'tx',coalesce((select jsonb_agg(to_jsonb(t) order by t.transaction_date desc,t.created_at desc) from public.finance_transactions t where t.period_month>=first_month and t.period_month<next_month),'[]'::jsonb),
    'accounts',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at) from public.finance_accounts a where a.active),'[]'::jsonb),
    'balances',coalesce((select jsonb_agg(to_jsonb(b)) from public.psp_finance_account_balances() b),'[]'::jsonb),
    'staff',coalesce((select jsonb_agg(to_jsonb(s) order by s.full_name) from public.finance_staff s),'[]'::jsonb),
    'salary',coalesce((select jsonb_agg(to_jsonb(s) order by s.period_month desc) from public.finance_salary_runs s where s.period_month>=first_month and s.period_month<next_month),'[]'::jsonb),
    'partners',coalesce((select jsonb_agg(to_jsonb(p) order by p.partner_name) from public.finance_partners p),'[]'::jsonb),
    'payouts',coalesce((select jsonb_agg(to_jsonb(p) order by p.period_month desc) from public.finance_partner_payouts p where p.period_month>=first_month and p.period_month<next_month),'[]'::jsonb),
    'obligations',coalesce((select jsonb_agg(to_jsonb(o) order by o.due_date) from public.finance_obligations o),'[]'::jsonb),
    'recurring',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from public.finance_recurring_items r),'[]'::jsonb),
    'budgets',coalesce((select jsonb_agg(to_jsonb(b)) from public.finance_budgets b where b.period_month>=first_month and b.period_month<next_month),'[]'::jsonb),
    'closures',coalesce((select jsonb_agg(to_jsonb(c) order by c.period_month desc) from public.finance_month_closures c where c.period_month>=first_month and c.period_month<next_month),'[]'::jsonb),
    'audit',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from (select * from public.finance_audit_log order by created_at desc limit case when p_audit then 200 else 7 end) a),'[]'::jsonb),
    'settings',coalesce((select jsonb_agg(to_jsonb(s)) from public.finance_settings s),'[]'::jsonb),
    'audit_loaded',p_audit
  ) into result;
  return result;
end;
$function$;
revoke all on function public.psp_admin_finance_workspace_v439(date,boolean,boolean) from public,anon;
grant execute on function public.psp_admin_finance_workspace_v439(date,boolean,boolean) to authenticated,service_role;
