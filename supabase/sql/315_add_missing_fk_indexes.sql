-- PipSePaisa V315
-- Add covering indexes for all foreign keys reported by the Supabase performance advisor.

create index if not exists idx_account_verifications_admin_trial_granted_by_fk_v315 on public.account_verifications(admin_trial_granted_by);
create index if not exists idx_account_verifications_reviewed_by_fk_v315 on public.account_verifications(reviewed_by);
create index if not exists idx_articles_author_id_fk_v315 on public.articles(author_id);
create index if not exists idx_banners_owner_id_fk_v315 on public.banners(owner_id);
create index if not exists idx_charts_owner_id_fk_v315 on public.charts(owner_id);
create index if not exists idx_community_notifications_actor_id_fk_v315 on public.community_notifications(actor_id);
create index if not exists idx_course_enrollments_reviewed_by_fk_v315 on public.course_enrollments(reviewed_by);
create index if not exists idx_courses_owner_id_fk_v315 on public.courses(owner_id);
create index if not exists idx_courses_premium_plan_id_fk_v315 on public.courses(premium_plan_id);
create index if not exists idx_dm_messages_receiver_id_fk_v315 on public.dm_messages(receiver_id);
create index if not exists idx_email_campaigns_created_by_fk_v315 on public.email_campaigns(created_by);
create index if not exists idx_finance_obligations_account_id_fk_v315 on public.finance_obligations(account_id);
create index if not exists idx_finance_obligations_transaction_id_fk_v315 on public.finance_obligations(transaction_id);
create index if not exists idx_finance_partner_payouts_transaction_id_fk_v315 on public.finance_partner_payouts(transaction_id);
create index if not exists idx_finance_recurring_items_account_id_fk_v315 on public.finance_recurring_items(account_id);
create index if not exists idx_finance_salary_runs_transaction_id_fk_v315 on public.finance_salary_runs(transaction_id);
create index if not exists idx_finance_transactions_parent_transaction_id_fk_v315 on public.finance_transactions(parent_transaction_id);
create index if not exists idx_group_bans_by_id_fk_v315 on public.group_bans(by_id);
create index if not exists idx_group_posts_user_id_fk_v315 on public.group_posts(user_id);
create index if not exists idx_news_posts_author_id_fk_v315 on public.news_posts(author_id);
create index if not exists idx_payment_requests_payment_method_id_fk_v315 on public.payment_requests(payment_method_id);
create index if not exists idx_payment_requests_plan_id_fk_v315 on public.payment_requests(plan_id);
create index if not exists idx_payment_requests_reviewed_by_fk_v315 on public.payment_requests(reviewed_by);
create index if not exists idx_pin_access_settings_updated_by_fk_v315 on public.pin_access_settings(updated_by);
create index if not exists idx_post_comments_user_id_fk_v315 on public.post_comments(user_id);
create index if not exists idx_post_reports_resolved_by_fk_v315 on public.post_reports(resolved_by);
create index if not exists idx_psp_ad_submissions_v259_enrollment_id_fk_v315 on public.psp_ad_submissions_v259(enrollment_id);
create index if not exists idx_psp_ad_submissions_v259_user_id_fk_v315 on public.psp_ad_submissions_v259(user_id);
create index if not exists idx_psp_fc2_events_conversation_id_fk_v315 on public.psp_fc2_events(conversation_id);
create index if not exists idx_quiz_history_user_id_fk_v315 on public.quiz_history(user_id);
create index if not exists idx_subscriptions_plan_id_fk_v315 on public.subscriptions(plan_id);
create index if not exists idx_subscriptions_user_id_fk_v315 on public.subscriptions(user_id);
create index if not exists idx_team_members_created_by_fk_v315 on public.team_members(created_by);
create index if not exists idx_tracked_links_created_by_fk_v315 on public.tracked_links(created_by);
