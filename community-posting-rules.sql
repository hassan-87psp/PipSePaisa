-- ============================================================
--  PipSePaisa — Community posting rules
--  Run this once in Supabase SQL editor.
--
--  Rules enforced:
--   • Official "PipSePaisa Community"  -> ONLY admin can post/comment; everyone reads.
--   • Mentor group                     -> the owning mentor always posts.
--                                          students post/comment ONLY if
--                                          "Everyone can post" is ON (members_can_post)
--                                          AND they are that mentor's student in the right tier.
--   • A 3rd mentor / other mentor's students / random users canNOT post.
-- ============================================================

-- 1) New column: per-group "Everyone can post" switch (default ON)
alter table public.groups add column if not exists members_can_post boolean default true;

-- 2) Helper: can the current user post in a given group?
create or replace function public.can_post_in_group(gid uuid)
returns boolean
language sql
security definer
stable
as $$
  select case
    -- Admin can always post (incl. the official PipSePaisa community)
    when public.is_admin() then true
    -- Official community: only admin (handled above) -> everyone else read-only
    when coalesce((select is_official from public.groups where id = gid), false) then false
    -- Any group OWNED BY AN ADMIN (e.g. PipSePaisa Community) -> only admin posts
    when coalesce((select (p.role = 'admin' or p.is_admin)
                   from public.profiles p
                   where p.id = (select owner_id from public.groups where id = gid)), false) then false
    -- The mentor who owns this group can always post
    when (select owner_id from public.groups where id = gid) = auth.uid() then true
    -- Students: only if "Everyone can post" is ON, they belong to THIS mentor, and tier matches
    else (
      coalesce((select members_can_post from public.groups where id = gid), true)
      and (select owner_id from public.groups where id = gid) = public.my_mentor_id()
      and case coalesce((select audience from public.groups where id = gid), 'all')
            when 'vip'     then coalesce((select member_type from public.profiles where id = auth.uid()), 'free') = 'vip'
            when 'premium' then coalesce((select member_type from public.profiles where id = auth.uid()), 'free') in ('premium','vip')
            else true
          end
    )
  end;
$$;

-- 3) Replace ALL existing INSERT policies on group_posts & post_comments
do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname='public' and tablename='group_posts' and cmd='INSERT' loop
    execute format('drop policy if exists %I on public.group_posts', r.policyname);
  end loop;
  for r in select policyname from pg_policies
           where schemaname='public' and tablename='post_comments' and cmd='INSERT' loop
    execute format('drop policy if exists %I on public.post_comments', r.policyname);
  end loop;
end $$;

-- 4) New INSERT policies
create policy gp_ins on public.group_posts
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_post_in_group(group_id)
  );

create policy pc_ins on public.post_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_post_in_group((select group_id from public.group_posts where id = post_id))
  );

-- Done.
