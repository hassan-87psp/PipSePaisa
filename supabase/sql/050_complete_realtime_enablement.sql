-- ============================================================
-- PIPSEPAISA QUERY 50
-- COMPLETE REALTIME ENABLEMENT
-- Safe to run repeatedly.
-- ============================================================

do $$
declare
  t text;
  realtime_tables text[] := array[
    'signals',
    'charts',
    'articles',
    'courses',
    'course_enrollments',
    'site_settings',
    'mentor_access_settings',
    'subscription_plans',
    'notifications',
    'news_posts',
    'banners',
    'youtube_videos',
    'payment_methods',
    'payment_requests',
    'support_messages',
    'dm_messages',
    'community_notifications',
    'group_posts',
    'post_likes',
    'post_comments',
    'post_poll_votes'
  ];
begin
  foreach t in array realtime_tables loop
    if to_regclass('public.' || t) is not null
       and not exists (
         select 1
         from pg_publication_tables
         where pubname='supabase_realtime'
           and schemaname='public'
           and tablename=t
       )
    then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';

select
  x.table_name,
  case when p.tablename is not null then '✅ REALTIME ON' else '❌ REALTIME OFF' end as status
from unnest(array[
  'signals','charts','articles','courses','course_enrollments',
  'site_settings','mentor_access_settings','subscription_plans',
  'notifications','news_posts','banners','youtube_videos',
  'payment_methods','payment_requests'
]) as x(table_name)
left join pg_publication_tables p
  on p.pubname='supabase_realtime'
 and p.schemaname='public'
 and p.tablename=x.table_name
order by x.table_name;
