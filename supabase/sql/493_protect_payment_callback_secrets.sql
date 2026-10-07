-- PipSePaisa V493 — keep Infinity callback secrets out of browser-readable payment rows.
-- Applied to production 2026-10-07.

begin;

create table if not exists public.psp_payment_callback_secrets_v493 (
  payment_scope text not null check (payment_scope in ('course','vip')),
  provider_request_id bigint not null,
  token_hash text not null check (length(token_hash)=64),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (payment_scope, provider_request_id)
);

alter table public.psp_payment_callback_secrets_v493 enable row level security;
revoke all on table public.psp_payment_callback_secrets_v493 from public, anon, authenticated;
grant select, insert, update, delete on table public.psp_payment_callback_secrets_v493 to service_role;

insert into public.psp_payment_callback_secrets_v493(
  payment_scope,provider_request_id,token_hash,expires_at,created_at,updated_at
)
select
  'course',
  cp.provider_request_id,
  encode(extensions.digest(cp.provider_callback_token,'sha256'),'hex'),
  cp.provider_expires_at,
  coalesce(cp.created_at,now()),
  now()
from public.course_payments cp
where nullif(btrim(cp.provider_callback_token),'') is not null
on conflict(payment_scope,provider_request_id) do update set
  token_hash=excluded.token_hash,
  expires_at=excluded.expires_at,
  updated_at=now();

insert into public.psp_payment_callback_secrets_v493(
  payment_scope,provider_request_id,token_hash,expires_at,created_at,updated_at
)
select
  'vip',
  pr.provider_request_id,
  encode(extensions.digest(pr.provider_callback_token,'sha256'),'hex'),
  pr.provider_expires_at,
  coalesce(pr.created_at,now()),
  now()
from public.payment_requests pr
where pr.provider_request_id is not null
  and nullif(btrim(pr.provider_callback_token),'') is not null
on conflict(payment_scope,provider_request_id) do update set
  token_hash=excluded.token_hash,
  expires_at=excluded.expires_at,
  updated_at=now();

update public.course_payments
set provider_callback_token=null
where provider_callback_token is not null;

update public.payment_requests
set provider_callback_token=null
where provider_callback_token is not null;

create or replace function public.psp_capture_payment_callback_secret_v493()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_scope text;
begin
  if nullif(btrim(new.provider_callback_token),'') is null then
    return new;
  end if;

  if new.provider_request_id is null then
    raise exception 'Provider request ID is required when setting a callback token.';
  end if;

  v_scope := case tg_table_name
    when 'course_payments' then 'course'
    when 'payment_requests' then 'vip'
    else null
  end;

  if v_scope is null then
    raise exception 'Unsupported payment callback secret source.';
  end if;

  insert into public.psp_payment_callback_secrets_v493(
    payment_scope,provider_request_id,token_hash,expires_at,updated_at
  )
  values(
    v_scope,
    new.provider_request_id,
    encode(extensions.digest(new.provider_callback_token,'sha256'),'hex'),
    new.provider_expires_at,
    now()
  )
  on conflict(payment_scope,provider_request_id) do update set
    token_hash=excluded.token_hash,
    expires_at=excluded.expires_at,
    updated_at=now();

  new.provider_callback_token := null;
  return new;
end;
$function$;

revoke all on function public.psp_capture_payment_callback_secret_v493()
  from public, anon, authenticated, service_role;

drop trigger if exists psp_capture_course_callback_secret_v493 on public.course_payments;
create trigger psp_capture_course_callback_secret_v493
before insert or update of provider_callback_token,provider_request_id,provider_expires_at
on public.course_payments
for each row
execute function public.psp_capture_payment_callback_secret_v493();

drop trigger if exists psp_capture_vip_callback_secret_v493 on public.payment_requests;
create trigger psp_capture_vip_callback_secret_v493
before insert or update of provider_callback_token,provider_request_id,provider_expires_at
on public.payment_requests
for each row
execute function public.psp_capture_payment_callback_secret_v493();

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
  );
$function$;

revoke all on function public.psp_verify_payment_callback_v493(text,bigint,text)
  from public, anon, authenticated;
grant execute on function public.psp_verify_payment_callback_v493(text,bigint,text)
  to service_role;

commit;
