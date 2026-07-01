-- Mentor Access Settings for Admin Panel
create table if not exists mentor_access_settings (
  key text primary key,
  enabled boolean not null default true,
  updated_at timestamptz default now()
);

alter table mentor_access_settings enable row level security;

drop policy if exists "Public read mentor access settings" on mentor_access_settings;
drop policy if exists "Allow insert mentor access settings" on mentor_access_settings;
drop policy if exists "Allow update mentor access settings" on mentor_access_settings;
drop policy if exists "Allow delete mentor access settings" on mentor_access_settings;

create policy "Public read mentor access settings"
on mentor_access_settings
for select
using (true);

create policy "Allow insert mentor access settings"
on mentor_access_settings
for insert
with check (true);

create policy "Allow update mentor access settings"
on mentor_access_settings
for update
using (true);

create policy "Allow delete mentor access settings"
on mentor_access_settings
for delete
using (true);

insert into mentor_access_settings (key, enabled) values
('dashboard', true),
('signals', true),
('charts', true),
('articles', true),
('subscriptions', false),
('courses', false),
('news', false),
('quiz', false),
('community', false),
('analytics', false),
('earnings', false),
('students', false),
('requests', false),
('chats', false),
('messages', false),
('notifications', false),
('settings', true)
on conflict (key) do nothing;
