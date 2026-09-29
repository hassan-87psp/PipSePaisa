-- PipSePaisa V312
-- Remove exact duplicate secondary indexes while preserving primary/unique
-- constraint-backed indexes and the higher-use equivalent indexes.

drop index if exists public.ai_reports_user_id_unique_idx;
drop index if exists public.course_payments_infinity_reuse_v224_idx;
drop index if exists public.courses_course_key_v98_idx;
drop index if exists public.email_campaign_recipients_campaign_email_uidx;
drop index if exists public.email_campaign_recipients_tracking_uidx;
drop index if exists public.email_campaign_recipients_unsub_uidx;
drop index if exists public.group_bans_group_user_unique_idx;
drop index if exists public.group_members_group_user_unique_idx;
drop index if exists public.idx_group_posts_group;
drop index if exists public.mentor_access_settings_key_unique_idx;
drop index if exists public.nh_impact_cache_id_unique_idx;
drop index if exists public.post_likes_post_user_unique_idx;
drop index if exists public.post_poll_votes_post_user_unique_idx;
drop index if exists public.site_settings_key_unique_idx;
drop index if exists public.team_broker_weekly_v207_lookup_idx;
drop index if exists public.team_client_attr_member_idx;
drop index if exists public.tracked_link_events_link_created_idx;
drop index if exists public.tracked_link_events_link_type_user_v211_idx;
drop index if exists public.idx_trades_user_id;
drop index if exists public.user_access_pins_access_pin_uidx;
