-- PipSePaisa V496 — expire/replay-protect hashed payment callback secrets.
-- Applied to production 2026-10-07.

begin;

create or replace function public.psp_verify_payment_callback_v493(
  p_scope text,
  p_request_id bigint,
  p_token text
)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists(
    select 1
    from public.psp_payment_callback_secrets_v493 s
    where s.payment_scope=p_scope
      and s.provider_request_id=p_request_id
      and s.token_hash=encode(extensions.digest(coalesce(p_token,''),'sha256'),'hex')
      and (s.expires_at is null or s.expires_at > now() - interval '5 minutes')
      and (
        (
          p_scope='course'
          and exists(
            select 1
            from public.course_payments cp
            where cp.provider='infinity'
              and cp.provider_request_id=p_request_id
              and lower(coalesce(cp.provider_status,cp.status,'')) in ('initiated','pending','processing','created')
              and (cp.provider_expires_at is null or cp.provider_expires_at > now() - interval '5 minutes')
          )
        )
        or
        (
          p_scope='vip'
          and exists(
            select 1
            from public.payment_requests pr
            where pr.provider='infinity'
              and pr.provider_request_id=p_request_id
              and lower(coalesce(pr.provider_status,pr.status,'')) in ('initiated','pending','processing','created')
              and (pr.provider_expires_at is null or pr.provider_expires_at > now() - interval '5 minutes')
          )
        )
      )
  );
$function$;

revoke all on function public.psp_verify_payment_callback_v493(text,bigint,text)
  from public, anon, authenticated;
grant execute on function public.psp_verify_payment_callback_v493(text,bigint,text)
  to service_role;

delete from public.psp_payment_callback_secrets_v493 s
where not (
  (s.payment_scope='course' and exists(
    select 1 from public.course_payments cp
    where cp.provider='infinity'
      and cp.provider_request_id=s.provider_request_id
      and lower(coalesce(cp.provider_status,cp.status,'')) in ('initiated','pending','processing','created')
      and (cp.provider_expires_at is null or cp.provider_expires_at > now() - interval '5 minutes')
  ))
  or
  (s.payment_scope='vip' and exists(
    select 1 from public.payment_requests pr
    where pr.provider='infinity'
      and pr.provider_request_id=s.provider_request_id
      and lower(coalesce(pr.provider_status,pr.status,'')) in ('initiated','pending','processing','created')
      and (pr.provider_expires_at is null or pr.provider_expires_at > now() - interval '5 minutes')
  ))
);

commit;
