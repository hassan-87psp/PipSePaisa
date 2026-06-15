-- =====================================================================
--  PipSePaisa — SCHEMA v2  (Mentor Ecosystem + Roles + Content Visibility)
--  Run AFTER the first schema. Safe to re-run (idempotent).
--  Supabase -> SQL Editor -> paste ALL -> RUN.
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- PROFILES: add role / mentor linkage / settings ----------
alter table public.profiles add column if not exists role text default 'student';        -- student | mentor | admin
alter table public.profiles add column if not exists mentor_id uuid references public.profiles(id);  -- student's mentor (null = PipSePaisa community)
alter table public.profiles add column if not exists referred_by_code text;              -- code used at signup
alter table public.profiles add column if not exists show_official_signals boolean default true;     -- (mentor setting)
-- mentor_code already exists from v1; ensure unique
create unique index if not exists profiles_mentor_code_uniq on public.profiles (mentor_code) where mentor_code is not null;

-- =====================================================================
--  HELPER FUNCTIONS (security definer = bypass RLS safely)
-- =====================================================================
create or replace function public.is_admin() returns boolean
language sql security definer set search_path=public stable as $$
  select coalesce((select (role='admin' or is_admin) from public.profiles where id=auth.uid()), false);
$$;

create or replace function public.my_role() returns text
language sql security definer set search_path=public stable as $$
  select coalesce((select role from public.profiles where id=auth.uid()),'student');
$$;

create or replace function public.my_mentor_id() returns uuid
language sql security definer set search_path=public stable as $$
  select mentor_id from public.profiles where id=auth.uid();
$$;

-- does the current user get to see OFFICIAL (PipSePaisa) content?
create or replace function public.sees_official() returns boolean
language sql security definer set search_path=public stable as $$
  select case
    when (select mentor_id from public.profiles where id=auth.uid()) is null then true   -- no mentor = PipSePaisa community
    else coalesce((select show_official_signals from public.profiles
                   where id=(select mentor_id from public.profiles where id=auth.uid())), true)
  end;
$$;

-- core visibility rule reused by all content tables
create or replace function public.can_see_content(owner uuid, official boolean) returns boolean
language sql security definer set search_path=public stable as $$
  select
    public.is_admin()
    or owner = auth.uid()                 -- own content
    or owner = public.my_mentor_id()      -- my mentor's content
    or (coalesce(official,false) and public.sees_official());  -- official content (if allowed)
$$;

-- resolve a mentor code to a mentor id (used at signup)
create or replace function public.mentor_id_for_code(code text) returns uuid
language sql security definer set search_path=public stable as $$
  select id from public.profiles where mentor_code = code and role='mentor' limit 1;
$$;

-- =====================================================================
--  NEW-USER TRIGGER: set role, link mentor by code, generate mentor code
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_role  text := coalesce(nullif(new.raw_user_meta_data->>'role',''),'student');
  v_code  text := nullif(new.raw_user_meta_data->>'mentor_code','');
  v_mentor uuid;
  v_mycode text;
begin
  -- link student to a mentor if a valid code was entered (optional)
  if v_code is not null then
    v_mentor := public.mentor_id_for_code(v_code);
  end if;

  -- if signing up as mentor, generate a unique short code
  if v_role = 'mentor' then
    loop
      v_mycode := upper(substr(md5(new.id::text || clock_timestamp()::text),1,7));
      exit when not exists (select 1 from public.profiles where mentor_code = v_mycode);
    end loop;
  end if;

  insert into public.profiles (id, email, full_name, username, phone, role, mentor_id, referred_by_code, mentor_code)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'phone',''),
    v_role, v_mentor, v_code, v_mycode
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- =====================================================================
--  CONTENT TABLES (owner_id + is_official drive visibility)
-- =====================================================================
create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  is_official boolean default false,
  pair text, direction text,
  entry_price numeric, stop_loss numeric, take_profit1 numeric, take_profit2 numeric,
  status text default 'active',     -- active | tp_hit | sl_hit | closed
  notes text, image_url text,
  created_at timestamptz default now()
);

create table if not exists public.charts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  is_official boolean default false,
  title text, pair text, image_url text, notes text,
  created_at timestamptz default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  type text default 'single',       -- single | chart
  title text, content text, image_url text, category text,
  is_official boolean default true,
  is_published boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,  -- mentor; null/admin = official
  is_official boolean default false,
  name text, price numeric default 0, currency text default 'PKR',
  duration_days int default 30, features text, is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  mentor_id  uuid references public.profiles(id) on delete set null,  -- null = PipSePaisa official
  plan_id    uuid references public.subscription_plans(id) on delete set null,
  plan_name text, amount numeric, currency text default 'PKR',
  payment_method text,               -- card | easypaisa | jazzcash | bank | manual
  status text default 'pending',     -- pending | active | expired | cancelled
  starts_at timestamptz, ends_at timestamptz,
  created_at timestamptz default now()
);

-- extend existing content tables with ownership (idempotent)
alter table public.courses        add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.courses        add column if not exists is_official boolean default true;
alter table public.news_posts     add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.news_posts     add column if not exists is_official boolean default true;
alter table public.quiz_questions add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.quiz_questions add column if not exists is_official boolean default true;

create table if not exists public.youtube_videos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  is_official boolean default false,
  title text, video_url text, description text,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,   -- mentor/admin who broadcasts
  is_official boolean default false,
  title text, body text,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  is_official boolean default false,
  title text, body text,
  created_at timestamptz default now()
);

-- =====================================================================
--  ROW LEVEL SECURITY
-- =====================================================================
-- profiles already has own-row policies in v1. Add admin + mentor reads:
alter table public.profiles enable row level security;
drop policy if exists profiles_admin_read   on public.profiles;
create policy profiles_admin_read   on public.profiles for select using (public.is_admin());
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update using (public.is_admin());
-- mentor can read the profiles of their own students:
drop policy if exists profiles_mentor_read on public.profiles;
create policy profiles_mentor_read on public.profiles for select using (mentor_id = auth.uid());
-- students may resolve a mentor's PUBLIC code is handled by SECURITY DEFINER fn, no open read needed.

-- generic helper to (re)apply content policies
do $$
declare tbl text;
begin
  foreach tbl in array array['signals','charts','subscription_plans','courses','news_posts','quiz_questions','youtube_videos','messages','notifications']
  loop
    execute format('alter table public.%I enable row level security;', tbl);
    execute format('drop policy if exists %I_sel on public.%I;', tbl, tbl);
    execute format('create policy %I_sel on public.%I for select using (public.can_see_content(owner_id, is_official));', tbl, tbl);
    execute format('drop policy if exists %I_ins on public.%I;', tbl, tbl);
    execute format('create policy %I_ins on public.%I for insert with check (owner_id = auth.uid() or public.is_admin());', tbl, tbl);
    execute format('drop policy if exists %I_upd on public.%I;', tbl, tbl);
    execute format('create policy %I_upd on public.%I for update using (owner_id = auth.uid() or public.is_admin());', tbl, tbl);
    execute format('drop policy if exists %I_del on public.%I;', tbl, tbl);
    execute format('create policy %I_del on public.%I for delete using (owner_id = auth.uid() or public.is_admin());', tbl, tbl);
  end loop;
end $$;

-- articles = platform content (everyone reads published; admin/author writes)
alter table public.articles enable row level security;
drop policy if exists articles_sel on public.articles;
create policy articles_sel on public.articles for select using (is_published = true or public.is_admin() or author_id = auth.uid());
drop policy if exists articles_ins on public.articles;
create policy articles_ins on public.articles for insert with check (public.is_admin() or author_id = auth.uid());
drop policy if exists articles_upd on public.articles;
create policy articles_upd on public.articles for update using (public.is_admin() or author_id = auth.uid());
drop policy if exists articles_del on public.articles;
create policy articles_del on public.articles for delete using (public.is_admin() or author_id = auth.uid());

-- subscriptions
alter table public.subscriptions enable row level security;
drop policy if exists subs_sel on public.subscriptions;
create policy subs_sel on public.subscriptions for select using (student_id = auth.uid() or mentor_id = auth.uid() or public.is_admin());
drop policy if exists subs_ins on public.subscriptions;
create policy subs_ins on public.subscriptions for insert with check (student_id = auth.uid() or public.is_admin());
drop policy if exists subs_upd on public.subscriptions;
create policy subs_upd on public.subscriptions for update using (mentor_id = auth.uid() or public.is_admin());

-- =====================================================================
--  DONE.  Make yourself admin:
--    update public.profiles set role='admin', is_admin=true where email='you@example.com';
-- =====================================================================
