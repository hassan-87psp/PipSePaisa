create table if not exists public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    token text unique not null,
    browser text,
    platform text,
    device text,
    enabled boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

do $$ begin
  create policy "Public read push subscriptions" on public.push_subscriptions for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Insert push subscriptions" on public.push_subscriptions for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Update push subscriptions" on public.push_subscriptions for update using (true);
exception when duplicate_object then null; end $$;
