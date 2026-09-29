-- PipSePaisa V319
-- Supabase RLS init-plan optimization. Authorization semantics unchanged.

alter policy "verification own read" on public."account_verifications" using (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "admin_activity_logs_admin_read" on public."admin_activity_logs" using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (lower(COALESCE(p.role, ''::text)) = ANY (ARRAY['admin'::text, 'super_admin'::text, 'superadmin'::text, 'finance'::text]))))));
alter policy "Users can create own AI report" on public."ai_reports" with check ((user_id = (select auth.uid())));
alter policy "Users can delete own AI report" on public."ai_reports" using ((user_id = (select auth.uid())));
alter policy "Users can update own AI report" on public."ai_reports" using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "Users can view own AI report" on public."ai_reports" using ((user_id = (select auth.uid())));
alter policy "ai_reports_own_all" on public."ai_reports" using (((user_id = (select auth.uid())) OR is_admin())) with check (((user_id = (select auth.uid())) OR is_admin()));
alter policy "Users can create community notifications" on public."community_notifications" with check ((actor_id = (select auth.uid())));
alter policy "Users can delete own community notifications" on public."community_notifications" using (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "Users can update own community notifications" on public."community_notifications" using (((user_id = (select auth.uid())) OR psp_is_admin())) with check (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "Users can view own community notifications" on public."community_notifications" using (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "community_notifications_own" on public."community_notifications" using (((user_id = (select auth.uid())) OR is_admin())) with check (((user_id = (select auth.uid())) OR is_admin()));
alter policy "course_classes_admin_delete" on public."course_classes" using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (lower(COALESCE(p.role, 'user'::text)) = 'admin'::text)))));
alter policy "course_classes_admin_insert" on public."course_classes" with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (lower(COALESCE(p.role, 'user'::text)) = 'admin'::text)))));
alter policy "course_classes_admin_update" on public."course_classes" using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (lower(COALESCE(p.role, 'user'::text)) = 'admin'::text))))) with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (lower(COALESCE(p.role, 'user'::text)) = 'admin'::text)))));
alter policy "Users submit own course enrollments" on public."course_enrollments" with check (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "Users update own pending enrollment details" on public."course_enrollments" using (((user_id = (select auth.uid())) OR psp_is_admin())) with check (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "Users view own course enrollments" on public."course_enrollments" using (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "Users view own course payment attempts" on public."course_payments" using (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "Users can create own course progress" on public."course_progress" with check (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "Users can delete own course progress" on public."course_progress" using (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "Users can update own course progress" on public."course_progress" using (((user_id = (select auth.uid())) OR psp_is_admin())) with check (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "Users can view own course progress" on public."course_progress" using (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "Recipients can mark messages read" on public."dm_messages" using (((recipient_id = (select auth.uid())) OR psp_is_admin())) with check (((recipient_id = (select auth.uid())) OR psp_is_admin()));
alter policy "Users can send direct messages" on public."dm_messages" with check (((sender_id = (select auth.uid())) AND (recipient_id <> (select auth.uid()))));
alter policy "Users can view own direct messages" on public."dm_messages" using (((sender_id = (select auth.uid())) OR (recipient_id = (select auth.uid())) OR psp_is_admin()));
alter policy "dm_own_all" on public."dm_messages" using (((sender_id = (select auth.uid())) OR (receiver_id = (select auth.uid())) OR is_admin())) with check (((sender_id = (select auth.uid())) OR is_admin()));
alter policy "Users create own requests" on public."ea_indicator_requests" with check ((user_id = (select auth.uid())));
alter policy "Users read own requests" on public."ea_indicator_requests" using (((user_id = (select auth.uid())) OR psp_eai_is_admin()));
alter policy "Users update own pending requests" on public."ea_indicator_requests" using (((user_id = (select auth.uid())) AND (status = ANY (ARRAY['pending'::text, 'rejected'::text])))) with check ((user_id = (select auth.uid())));
alter policy "Users can view relevant restrictions" on public."group_bans" using (((user_id = (select auth.uid())) OR psp_is_admin() OR psp_group_can_manage(group_id)));
alter policy "posts_delete" on public."group_posts" using (((user_id = (select auth.uid())) OR is_mentor_or_admin()));
alter policy "posts_insert" on public."group_posts" with check ((user_id = (select auth.uid())));
alter policy "posts_update" on public."group_posts" using (((user_id = (select auth.uid())) OR is_mentor_or_admin()));
alter policy "groups_staff_write" on public."groups" using (((owner_id = (select auth.uid())) OR is_admin())) with check (((owner_id = (select auth.uid())) OR is_admin()));
alter policy "Members can create allowed logs" on public."moderation_log" with check ((actor_id = (select auth.uid())));
alter policy "Admin and PSP Mentor create notifications" on public."notifications" with check (((psp_is_admin() OR psp_is_psp_mentor()) AND (owner_id = (select auth.uid()))));
alter policy "Members can view available notifications" on public."notifications" using ((psp_is_admin() OR (owner_id = (select auth.uid())) OR ((is_official = true) AND psp_notification_matches_user(owner_id, audience))));
alter policy "Owners can delete notifications" on public."notifications" using ((psp_is_admin() OR (owner_id = (select auth.uid()))));
alter policy "Owners can update notifications" on public."notifications" using ((psp_is_admin() OR (owner_id = (select auth.uid())))) with check ((psp_is_admin() OR (owner_id = (select auth.uid()))));
alter policy "Admin creates manual payment methods" on public."payment_methods" with check (((COALESCE(is_system, false) = false) AND ((owner_id = (select auth.uid())) OR psp_is_admin())));
alter policy "Admin deletes manual payment methods" on public."payment_methods" using (((COALESCE(is_system, false) = false) AND ((owner_id = (select auth.uid())) OR psp_is_admin())));
alter policy "Admin updates manual payment methods" on public."payment_methods" using (((COALESCE(is_system, false) = false) AND ((owner_id = (select auth.uid())) OR psp_is_admin()))) with check (((COALESCE(is_system, false) = false) AND ((owner_id = (select auth.uid())) OR psp_is_admin())));
alter policy "Admin views all payment methods" on public."payment_methods" using (((owner_id = (select auth.uid())) OR psp_is_admin() OR (is_system = true)));
alter policy "payment_requests_own_insert" on public."payment_requests" with check ((user_id = (select auth.uid())));
alter policy "payment_requests_own_read" on public."payment_requests" using (((user_id = (select auth.uid())) OR is_admin()));
alter policy "Authors and moderators delete comments" on public."post_comments" using (((author_id = (select auth.uid())) OR psp_can_manage_post(post_id)));
alter policy "Authors can update comments" on public."post_comments" using (((author_id = (select auth.uid())) OR psp_can_manage_post(post_id))) with check (((author_id = (select auth.uid())) OR psp_can_manage_post(post_id)));
alter policy "Members can add post comments" on public."post_comments" with check (((author_id = (select auth.uid())) AND psp_can_view_post(post_id)));
alter policy "comments_delete" on public."post_comments" using (((user_id = (select auth.uid())) OR is_mentor_or_admin()));
alter policy "comments_insert" on public."post_comments" with check ((user_id = (select auth.uid())));
alter policy "Members can add post reactions" on public."post_likes" with check (((user_id = (select auth.uid())) AND psp_can_view_post(post_id)));
alter policy "Users can delete own reactions" on public."post_likes" using (((user_id = (select auth.uid())) OR psp_can_manage_post(post_id)));
alter policy "Users can update own reactions" on public."post_likes" using ((user_id = (select auth.uid()))) with check (((user_id = (select auth.uid())) AND psp_can_view_post(post_id)));
alter policy "likes_all" on public."post_likes" using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "Members can submit poll votes" on public."post_poll_votes" with check (((user_id = (select auth.uid())) AND psp_can_view_post(post_id)));
alter policy "Users can delete own poll votes" on public."post_poll_votes" using (((user_id = (select auth.uid())) OR psp_can_manage_post(post_id)));
alter policy "Users can update own poll votes" on public."post_poll_votes" using ((user_id = (select auth.uid()))) with check (((user_id = (select auth.uid())) AND psp_can_view_post(post_id)));
alter policy "poll_votes_all" on public."post_poll_votes" using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "Users can delete own open reports" on public."post_reports" using ((((reporter_id = (select auth.uid())) AND (status = 'open'::text)) OR psp_is_admin() OR psp_group_can_manage(group_id)));
alter policy "Users can report posts" on public."post_reports" with check (((reporter_id = (select auth.uid())) AND psp_group_can_view(group_id)));
alter policy "Users can view relevant reports" on public."post_reports" using (((reporter_id = (select auth.uid())) OR psp_is_admin() OR psp_group_can_manage(group_id)));
alter policy "reports_insert" on public."post_reports" with check ((reporter_id = (select auth.uid())));
alter policy "profiles_update_own" on public."profiles" using (((id = (select auth.uid())) OR is_admin())) with check (((id = (select auth.uid())) OR is_admin()));
alter policy "quiz_history_own_all" on public."quiz_history" using (((user_id = (select auth.uid())) OR is_admin())) with check (((user_id = (select auth.uid())) OR is_admin()));
alter policy "psp_v157_signal_creator_insert" on public."signals" with check (((owner_id = (select auth.uid())) AND psp_can_manage_signals()));
alter policy "psp_v157_signal_owner_delete" on public."signals" using ((((owner_id = (select auth.uid())) AND psp_can_manage_signals()) OR psp_is_admin()));
alter policy "psp_v157_signal_owner_update" on public."signals" using ((((owner_id = (select auth.uid())) AND psp_can_manage_signals()) OR psp_is_admin())) with check ((((owner_id = (select auth.uid())) AND psp_can_manage_signals()) OR psp_is_admin()));
alter policy "subscriptions_own_read" on public."subscriptions" using (((user_id = (select auth.uid())) OR is_admin()));
alter policy "Users and admins can create support messages" on public."support_messages" with check ((psp_is_admin() OR ((user_id = (select auth.uid())) AND (sender = 'user'::text))));
alter policy "Users can view own support messages" on public."support_messages" using (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "support_own_read" on public."support_messages" using (((user_id = (select auth.uid())) OR is_admin()));
alter policy "Users delete own trades" on public."trades" using ((((select auth.uid()))::text = (user_id)::text));
alter policy "Users manage own trades" on public."trades" using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "trades_own_all" on public."trades" using (((user_id = (select auth.uid())) OR is_admin())) with check (((user_id = (select auth.uid())) OR is_admin()));
alter policy "Users read own PIN status" on public."user_access_pins" using (((user_id = (select auth.uid())) OR psp_is_admin()));
alter policy "zoom_course_registrations_admin_read" on public."zoom_course_registrations" using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (lower(COALESCE(p.role, ''::text)) = ANY (ARRAY['admin'::text, 'owner'::text, 'super_admin'::text, 'superadmin'::text]))))));
alter policy "zoom_course_registrations_own_read" on public."zoom_course_registrations" using ((user_id = (select auth.uid())));
alter policy "zoom_webinar_catalog_admin_all" on public."zoom_webinar_catalog" using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (lower(COALESCE(p.role, ''::text)) = ANY (ARRAY['admin'::text, 'owner'::text, 'super_admin'::text, 'superadmin'::text])))))) with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (lower(COALESCE(p.role, ''::text)) = ANY (ARRAY['admin'::text, 'owner'::text, 'super_admin'::text, 'superadmin'::text]))))));