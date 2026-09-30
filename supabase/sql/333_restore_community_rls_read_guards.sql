
drop policy if exists "groups_read" on public.groups;
drop policy if exists "posts_read" on public.group_posts;
drop policy if exists "bans_read" on public.group_bans;
drop policy if exists "community_read" on public.post_comments;
drop policy if exists "community_read" on public.post_likes;
drop policy if exists "community_read" on public.post_poll_votes;
drop policy if exists "community_read" on public.post_reports;
