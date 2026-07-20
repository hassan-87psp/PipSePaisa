-- Add optional description for social media banners
alter table public.banners
add column if not exists description text;
