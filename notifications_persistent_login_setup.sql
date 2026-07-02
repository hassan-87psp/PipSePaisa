-- PipSePaisa notifications + persistent login support
-- Note: persistent login is handled in website JavaScript with persistSession/localStorage.
-- Run this SQL only to make sure notifications table/policies support publish notifications.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid()
);

alter table public.notifications
  add column if not exists owner_id uuid,
  add column if not exists is_official boolean default true,
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists type text default 'general',
  add column if not exists action_link text,
  add column if not exists audience text default 'all';

alter table public.notifications enable row level security;

drop policy if exists "Public read notifications" on public.notifications;
drop policy if exists "Allow insert notifications" on public.notifications;
drop policy if exists "Allow update notifications" on public.notifications;

create policy "Public read notifications"
on public.notifications
for select
using (true);

create policy "Allow insert notifications"
on public.notifications
for insert
with check (true);

create policy "Allow update notifications"
on public.notifications
for update
using (true);
