-- PipSePaisa V494 — defense in depth: cleartext callback tokens must never persist.
-- Applied to production 2026-10-07.

begin;

alter table public.course_payments
  drop constraint if exists course_payments_callback_token_must_be_null_v494;
alter table public.course_payments
  add constraint course_payments_callback_token_must_be_null_v494
  check (provider_callback_token is null);

alter table public.payment_requests
  drop constraint if exists payment_requests_callback_token_must_be_null_v494;
alter table public.payment_requests
  add constraint payment_requests_callback_token_must_be_null_v494
  check (provider_callback_token is null);

commit;
