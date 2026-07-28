-- ============================================================
-- PIPSEPAISA QUERY 47
-- PAYMENT METHODS SAVE + COURSE ENROLLMENT VISIBILITY FIX
-- Existing data is preserved.
-- ============================================================

alter table public.payment_methods
  add column if not exists name text,
  add column if not exists owner_id uuid,
  add column if not exists type text default 'bank',
  add column if not exists label text,
  add column if not exists account_title text,
  add column if not exists account_number text,
  add column if not exists bank_name text,
  add column if not exists wallet text,
  add column if not exists network text,
  add column if not exists enabled boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.payment_methods
set
  name = coalesce(
    nullif(trim(name), ''),
    nullif(trim(label), ''),
    case lower(coalesce(type,'')) 
      when 'easypaisa' then 'EasyPaisa'
      when 'jazzcash' then 'JazzCash'
      when 'bank' then 'Bank Transfer'
      when 'crypto' then 'USDT TRC20'
      else 'Payment Method'
    end
  ),
  label = coalesce(nullif(trim(label), ''), nullif(trim(name), ''), 'Payment Method'),
  enabled = coalesce(enabled, true),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.payment_methods
  alter column name set default 'Payment Method',
  alter column name set not null,
  alter column owner_id set default auth.uid(),
  alter column enabled set default true,
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.payment_methods enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname='public'
      and tablename='payment_methods'
  loop
    execute format(
      'drop policy if exists %I on public.payment_methods',
      p.policyname
    );
  end loop;
end $$;

-- Public course page needs enabled payment instructions before signup.
create policy "Public views enabled payment methods"
on public.payment_methods
for select
to anon, authenticated
using (enabled = true);

create policy "Admin views all payment methods"
on public.payment_methods
for select
to authenticated
using (
  owner_id = auth.uid()
  or public.psp_is_admin()
);

create policy "Admin creates payment methods"
on public.payment_methods
for insert
to authenticated
with check (
  owner_id = auth.uid()
  or public.psp_is_admin()
);

create policy "Admin updates payment methods"
on public.payment_methods
for update
to authenticated
using (
  owner_id = auth.uid()
  or public.psp_is_admin()
)
with check (
  owner_id = auth.uid()
  or public.psp_is_admin()
);

create policy "Admin deletes payment methods"
on public.payment_methods
for delete
to authenticated
using (
  owner_id = auth.uid()
  or public.psp_is_admin()
);

grant select on public.payment_methods to anon;
grant select, insert, update, delete on public.payment_methods to authenticated;
grant all on public.payment_methods to service_role;

notify pgrst, 'reload schema';

select
  name,
  type,
  enabled,
  case
    when name is not null then '✅ READY'
    else '❌ NAME MISSING'
  end as status
from public.payment_methods
order by created_at desc;
