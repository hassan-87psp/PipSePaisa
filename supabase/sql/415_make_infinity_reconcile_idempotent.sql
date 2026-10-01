
create or replace function public.psp_reconcile_all_infinity_state()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count integer:=0;
begin
  if auth.uid() is null or not public.psp_is_admin() then
    raise exception 'Admin access required.';
  end if;

  with latest as (
    select distinct on (cp.enrollment_id)
      cp.enrollment_id,cp.user_id,cp.provider_request_id,
      lower(coalesce(cp.provider_status,cp.status,'')) as pstatus,
      cp.provider_last_error,cp.updated_at
    from public.course_payments cp
    where cp.provider='infinity' and cp.enrollment_id is not null
    order by cp.enrollment_id,cp.created_at desc nulls last,cp.id desc
  ), terminal as (
    select * from latest
    where pstatus in (
      'accepted','approved','success','successful','completed','complete','paid','captured','confirmed','verified','settled',
      'rejected','declined','failed','failure','cancelled','canceled','void','reversed','expired'
    )
  ), desired as (
    select
      t.*,
      case
        when t.pstatus in ('accepted','approved','success','successful','completed','complete','paid','captured','confirmed','verified','settled') then 'accepted'
        when t.pstatus='expired' then 'expired'
        else 'rejected'
      end as d_provider_status,
      case
        when t.pstatus in ('accepted','approved','success','successful','completed','complete','paid','captured','confirmed','verified','settled') then 'approved'
        when t.pstatus='expired' then 'pending'
        else 'rejected'
      end as d_payment_status,
      case
        when t.pstatus in ('accepted','approved','success','successful','completed','complete','paid','captured','confirmed','verified','settled') then 'enrolled'
        when t.pstatus='expired' then 'pending'
        else 'rejected'
      end as d_enrollment_status,
      case
        when t.pstatus='expired' then coalesce(nullif(t.provider_last_error,''),'Infinity payment window expired.')
        when t.pstatus in ('rejected','declined','failed','failure','cancelled','canceled','void','reversed')
          then coalesce(nullif(t.provider_last_error,''),'Payment rejected by Infinity.')
        else null
      end as d_provider_reason,
      case
        when t.pstatus='expired' then 'Infinity payment window expired. Start a new Local Bank Transfer.'
        when t.pstatus in ('rejected','declined','failed','failure','cancelled','canceled','void','reversed')
          then coalesce(nullif(t.provider_last_error,''),'Payment rejected by Infinity.')
        else null
      end as d_provider_error,
      case
        when t.pstatus in ('rejected','declined','failed','failure','cancelled','canceled','void','reversed')
          then coalesce(nullif(t.provider_last_error,''),'Payment rejected by Infinity.')
        else null
      end as d_rejection_reason
    from terminal t
  )
  update public.course_enrollments ce
     set payment_method='Local Bank Transfer',
         payment_provider='infinity',
         provider_request_id=t.provider_request_id,
         provider_status=t.d_provider_status,
         payment_status=t.d_payment_status,
         enrollment_status=t.d_enrollment_status,
         access_granted_at=case
           when t.d_enrollment_status='enrolled' then coalesce(ce.access_granted_at,now())
           else null
         end,
         provider_rejection_reason=t.d_provider_reason,
         provider_last_error=t.d_provider_error,
         rejection_reason=t.d_rejection_reason,
         provider_redirect_url=case when t.pstatus='expired' then null else ce.provider_redirect_url end,
         updated_at=now()
    from desired t
   where ce.id=t.enrollment_id
     and ce.user_id=t.user_id
     and (
       t.d_enrollment_status='enrolled'
       or (coalesce(ce.payment_status,'')<>'approved' and coalesce(ce.enrollment_status,'')<>'enrolled')
     )
     and (
       ce.payment_method,
       ce.payment_provider,
       ce.provider_request_id,
       ce.provider_status,
       ce.payment_status,
       ce.enrollment_status,
       ce.access_granted_at,
       ce.provider_rejection_reason,
       ce.provider_last_error,
       ce.rejection_reason,
       ce.provider_redirect_url
     ) is distinct from (
       'Local Bank Transfer'::text,
       'infinity'::text,
       t.provider_request_id,
       t.d_provider_status,
       t.d_payment_status,
       t.d_enrollment_status,
       case when t.d_enrollment_status='enrolled' then ce.access_granted_at else null end,
       t.d_provider_reason,
       t.d_provider_error,
       t.d_rejection_reason,
       case when t.pstatus='expired' then null else ce.provider_redirect_url end
     );

  get diagnostics v_count=row_count;
  return v_count;
end;
$function$;

create or replace function public.psp_reconcile_my_infinity_payments()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_count integer:=0;
  v_expired integer:=0;
begin
  if v_uid is null then raise exception 'Authentication required.'; end if;

  with latest as (
    select distinct on (cp.enrollment_id)
      cp.enrollment_id,cp.user_id,cp.provider_request_id,
      lower(coalesce(cp.provider_status,cp.status,'')) as pstatus,
      cp.provider_last_error
    from public.course_payments cp
    where cp.provider='infinity' and cp.user_id=v_uid and cp.enrollment_id is not null
    order by cp.enrollment_id,cp.created_at desc nulls last,cp.id desc
  ), terminal as (
    select * from latest
    where pstatus in (
      'accepted','approved','success','successful','completed','complete','paid','captured','confirmed','verified','settled',
      'rejected','declined','failed','failure','cancelled','canceled','void','reversed','expired'
    )
  ), desired as (
    select
      t.*,
      case
        when t.pstatus in ('accepted','approved','success','successful','completed','complete','paid','captured','confirmed','verified','settled') then 'accepted'
        when t.pstatus='expired' then 'expired'
        else 'rejected'
      end as d_provider_status,
      case
        when t.pstatus in ('accepted','approved','success','successful','completed','complete','paid','captured','confirmed','verified','settled') then 'approved'
        when t.pstatus='expired' then 'pending'
        else 'rejected'
      end as d_payment_status,
      case
        when t.pstatus in ('accepted','approved','success','successful','completed','complete','paid','captured','confirmed','verified','settled') then 'enrolled'
        when t.pstatus='expired' then 'pending'
        else 'rejected'
      end as d_enrollment_status,
      case
        when t.pstatus='expired' then coalesce(nullif(t.provider_last_error,''),'Infinity payment window expired.')
        when t.pstatus in ('rejected','declined','failed','failure','cancelled','canceled','void','reversed')
          then coalesce(nullif(t.provider_last_error,''),'Payment rejected by Infinity.')
        else null
      end as d_provider_reason,
      case
        when t.pstatus='expired' then 'Infinity payment window expired. Start a new Local Bank Transfer.'
        when t.pstatus in ('rejected','declined','failed','failure','cancelled','canceled','void','reversed')
          then coalesce(nullif(t.provider_last_error,''),'Payment rejected by Infinity.')
        else null
      end as d_provider_error,
      case
        when t.pstatus in ('rejected','declined','failed','failure','cancelled','canceled','void','reversed')
          then coalesce(nullif(t.provider_last_error,''),'Payment rejected by Infinity.')
        else null
      end as d_rejection_reason
    from terminal t
  )
  update public.course_enrollments ce
     set provider_status=t.d_provider_status,
         payment_status=t.d_payment_status,
         enrollment_status=t.d_enrollment_status,
         access_granted_at=case
           when t.d_enrollment_status='enrolled' then coalesce(ce.access_granted_at,now())
           else null
         end,
         provider_rejection_reason=t.d_provider_reason,
         provider_last_error=t.d_provider_error,
         rejection_reason=t.d_rejection_reason,
         provider_redirect_url=case when t.pstatus='expired' then null else ce.provider_redirect_url end,
         updated_at=now()
    from desired t
   where ce.id=t.enrollment_id
     and ce.user_id=v_uid
     and (
       t.d_enrollment_status='enrolled'
       or (coalesce(ce.payment_status,'')<>'approved' and coalesce(ce.enrollment_status,'')<>'enrolled')
     )
     and (
       ce.provider_status,
       ce.payment_status,
       ce.enrollment_status,
       ce.access_granted_at,
       ce.provider_rejection_reason,
       ce.provider_last_error,
       ce.rejection_reason,
       ce.provider_redirect_url
     ) is distinct from (
       t.d_provider_status,
       t.d_payment_status,
       t.d_enrollment_status,
       case when t.d_enrollment_status='enrolled' then ce.access_granted_at else null end,
       t.d_provider_reason,
       t.d_provider_error,
       t.d_rejection_reason,
       case when t.pstatus='expired' then null else ce.provider_redirect_url end
     );

  get diagnostics v_count=row_count;

  with stale as (
    select cp.id,cp.enrollment_id,cp.provider_request_id,
           coalesce(cp.provider_expires_at,cp.created_at+interval '20 minutes') as expires_at
    from public.course_payments cp
    where cp.user_id=v_uid and cp.provider='infinity'
      and lower(coalesce(cp.provider_status,cp.status,'')) in ('initiated','created','submitted','pending','processing','waiting','awaiting','in_process','queued')
      and coalesce(cp.provider_expires_at,cp.created_at+interval '20 minutes')<=now()
  ), upd as (
    update public.course_payments cp
       set provider_status='expired',
           provider_expires_at=s.expires_at,
           provider_last_error='Infinity payment window expired.',
           updated_at=now()
      from stale s
     where cp.id=s.id
     returning cp.enrollment_id,cp.provider_request_id,cp.provider_expires_at as expires_at
  )
  update public.course_enrollments ce
     set provider_status='expired',
         provider_expires_at=u.expires_at,
         provider_redirect_url=null,
         provider_last_error='Infinity payment window expired. Start a new Local Bank Transfer.',
         provider_rejection_reason='Infinity payment window expired.',
         payment_status='pending',
         enrollment_status='pending',
         access_granted_at=null,
         rejection_reason=null,
         reviewed_by=null,
         reviewed_at=null,
         updated_at=now()
    from upd u
   where ce.id=u.enrollment_id and ce.user_id=v_uid
     and ce.provider_request_id=u.provider_request_id
     and coalesce(ce.payment_status,'')<>'approved'
     and coalesce(ce.enrollment_status,'')<>'enrolled';

  get diagnostics v_expired=row_count;
  return v_count+v_expired;
end;
$function$;
