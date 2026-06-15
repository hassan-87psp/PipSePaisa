-- =====================================================================
--  PipSePaisa — Supabase Database Schema
--  Project: vjqvoinsspgsrcyhwspy
--  HOW TO RUN: Supabase Dashboard -> SQL Editor -> New query ->
--              paste ALL of this -> RUN.  (Run once.)
-- =====================================================================

-- ---------- 1. PROFILES (one row per user) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  username    text,
  phone       text,
  country     text,
  bio         text,
  is_premium  boolean default false,
  is_admin    boolean default false,
  is_banned   boolean default false,
  mentor_code text,           -- code is user shows to refer others (future)
  referred_by text,           -- mentor code this user signed up with (future)
  created_at  timestamptz default now()
);

-- ---------- 2. TRADES (trading journal) ----------
create table if not exists public.trades (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  pair        text,
  direction   text,
  entry_price numeric,
  exit_price  numeric,
  lot_size    numeric,
  stop_loss   numeric,
  take_profit numeric,
  pnl         numeric,
  strategy    text,
  emotion     text,
  notes       text,
  trade_date  date,
  created_at  timestamptz default now()
);

-- ---------- 3. COURSES (Learn section) ----------
create table if not exists public.courses (
  id           uuid primary key default gen_random_uuid(),
  title        text,
  description  text,
  content      text,
  thumbnail    text,
  category     text,
  is_published boolean default true,
  created_at   timestamptz default now()
);

-- ---------- 4. NEWS_POSTS (in-app news/announcements) ----------
create table if not exists public.news_posts (
  id           uuid primary key default gen_random_uuid(),
  title        text,
  content      text,
  category     text,
  image        text,
  is_published boolean default true,
  created_at   timestamptz default now()
);

-- ---------- 5. QUIZ_QUESTIONS ----------
create table if not exists public.quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  question       text,
  options        jsonb,
  correct_answer text,
  explanation    text,
  created_at     timestamptz default now()
);

-- ---------- 6. QUIZ_HISTORY ----------
create table if not exists public.quiz_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  score      int,
  total      int,
  created_at timestamptz default now()
);

-- =====================================================================
--  AUTO-CREATE a profiles row whenever a new user signs up
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, username, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
--  ROW LEVEL SECURITY (each user sees only their own data)
-- =====================================================================
alter table public.profiles      enable row level security;
alter table public.trades        enable row level security;
alter table public.courses       enable row level security;
alter table public.news_posts    enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_history  enable row level security;

-- profiles: user can read/insert/update only their own row
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

-- trades: full control over own trades only
drop policy if exists trades_own on public.trades;
create policy trades_own on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- quiz_history: own only
drop policy if exists quiz_history_own on public.quiz_history;
create policy quiz_history_own on public.quiz_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- public content everyone can read (Learn / News / Quiz)
drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses for select using (true);
drop policy if exists news_read on public.news_posts;
create policy news_read on public.news_posts for select using (true);
drop policy if exists quiz_read on public.quiz_questions;
create policy quiz_read on public.quiz_questions for select using (true);

-- =====================================================================
--  DONE.
--  After running, make yourself ADMIN (replace with YOUR email):
--    update public.profiles set is_admin = true where email = 'you@example.com';
-- =====================================================================
