-- Order type column (Market / Limit / Stop) — SQL Editor me RUN karo
alter table public.signals add column if not exists order_type text default 'market';
