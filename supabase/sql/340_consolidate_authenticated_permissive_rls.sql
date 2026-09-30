-- PipSePaisa V340
-- Consolidate authenticated permissive RLS policies without changing effective access.
-- Restrictive and non-authenticated-role policies are intentionally preserved.

drop policy if exists "Users can create community notifications" on public."community_notifications";
drop policy if exists "Users can delete own community notifications" on public."community_notifications";
drop policy if exists "Users can update own community notifications" on public."community_notifications";
drop policy if exists "Users can view own community notifications" on public."community_notifications";
drop policy if exists "community_notifications_own" on public."community_notifications";
drop policy if exists "psp_v340_authenticated_select" on public."community_notifications";
create policy "psp_v340_authenticated_select" on public."community_notifications" as permissive for select to authenticated using ((((user_id = ( SELECT auth.uid() AS uid)) OR psp_is_admin())) OR (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())));
drop policy if exists "psp_v340_authenticated_insert" on public."community_notifications";
create policy "psp_v340_authenticated_insert" on public."community_notifications" as permissive for insert to authenticated with check (((actor_id = ( SELECT auth.uid() AS uid))) OR (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())));
drop policy if exists "psp_v340_authenticated_update" on public."community_notifications";
create policy "psp_v340_authenticated_update" on public."community_notifications" as permissive for update to authenticated using ((((user_id = ( SELECT auth.uid() AS uid)) OR psp_is_admin())) OR (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()))) with check ((((user_id = ( SELECT auth.uid() AS uid)) OR psp_is_admin())) OR (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())));
drop policy if exists "psp_v340_authenticated_delete" on public."community_notifications";
create policy "psp_v340_authenticated_delete" on public."community_notifications" as permissive for delete to authenticated using ((((user_id = ( SELECT auth.uid() AS uid)) OR psp_is_admin())) OR (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())));

drop policy if exists "Admins can delete direct messages" on public."dm_messages";
drop policy if exists "Recipients can mark messages read" on public."dm_messages";
drop policy if exists "Users can send direct messages" on public."dm_messages";
drop policy if exists "Users can view own direct messages" on public."dm_messages";
drop policy if exists "dm_own_all" on public."dm_messages";
drop policy if exists "psp_v340_authenticated_select" on public."dm_messages";
create policy "psp_v340_authenticated_select" on public."dm_messages" as permissive for select to authenticated using ((((sender_id = ( SELECT auth.uid() AS uid)) OR (recipient_id = ( SELECT auth.uid() AS uid)) OR psp_is_admin())) OR (((sender_id = ( SELECT auth.uid() AS uid)) OR (receiver_id = ( SELECT auth.uid() AS uid)) OR is_admin())));
drop policy if exists "psp_v340_authenticated_insert" on public."dm_messages";
create policy "psp_v340_authenticated_insert" on public."dm_messages" as permissive for insert to authenticated with check ((((sender_id = ( SELECT auth.uid() AS uid)) AND (recipient_id <> ( SELECT auth.uid() AS uid)))) OR (((sender_id = ( SELECT auth.uid() AS uid)) OR is_admin())));
drop policy if exists "psp_v340_authenticated_update" on public."dm_messages";
create policy "psp_v340_authenticated_update" on public."dm_messages" as permissive for update to authenticated using ((((recipient_id = ( SELECT auth.uid() AS uid)) OR psp_is_admin())) OR (((sender_id = ( SELECT auth.uid() AS uid)) OR (receiver_id = ( SELECT auth.uid() AS uid)) OR is_admin()))) with check ((((recipient_id = ( SELECT auth.uid() AS uid)) OR psp_is_admin())) OR (((sender_id = ( SELECT auth.uid() AS uid)) OR is_admin())));
drop policy if exists "psp_v340_authenticated_delete" on public."dm_messages";
create policy "psp_v340_authenticated_delete" on public."dm_messages" as permissive for delete to authenticated using ((psp_is_admin()) OR (((sender_id = ( SELECT auth.uid() AS uid)) OR (receiver_id = ( SELECT auth.uid() AS uid)) OR is_admin())));

drop policy if exists "Admins delete all requests" on public."ea_indicator_requests";
drop policy if exists "Admins insert all requests" on public."ea_indicator_requests";
drop policy if exists "Admins update all requests" on public."ea_indicator_requests";
drop policy if exists "Users create own requests" on public."ea_indicator_requests";
drop policy if exists "Users read own requests" on public."ea_indicator_requests";
drop policy if exists "Users update own pending requests" on public."ea_indicator_requests";
drop policy if exists "psp_v340_authenticated_select" on public."ea_indicator_requests";
create policy "psp_v340_authenticated_select" on public."ea_indicator_requests" as permissive for select to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR psp_eai_is_admin()));
drop policy if exists "psp_v340_authenticated_insert" on public."ea_indicator_requests";
create policy "psp_v340_authenticated_insert" on public."ea_indicator_requests" as permissive for insert to authenticated with check ((psp_eai_is_admin()) OR ((user_id = ( SELECT auth.uid() AS uid))));
drop policy if exists "psp_v340_authenticated_update" on public."ea_indicator_requests";
create policy "psp_v340_authenticated_update" on public."ea_indicator_requests" as permissive for update to authenticated using ((psp_eai_is_admin()) OR (((user_id = ( SELECT auth.uid() AS uid)) AND (status = ANY (ARRAY['pending'::text, 'rejected'::text]))))) with check ((psp_eai_is_admin()) OR ((user_id = ( SELECT auth.uid() AS uid))));
drop policy if exists "psp_v340_authenticated_delete" on public."ea_indicator_requests";
create policy "psp_v340_authenticated_delete" on public."ea_indicator_requests" as permissive for delete to authenticated using (psp_eai_is_admin());

drop policy if exists "Admins manage product versions" on public."ea_indicator_versions";
drop policy if exists "Product versions readable" on public."ea_indicator_versions";
drop policy if exists "psp_v340_authenticated_select" on public."ea_indicator_versions";
create policy "psp_v340_authenticated_select" on public."ea_indicator_versions" as permissive for select to authenticated using ((psp_eai_is_admin()) OR ((EXISTS ( SELECT 1
   FROM ea_indicator_products p
  WHERE ((p.id = ea_indicator_versions.product_id) AND ((p.status = 'published'::text) OR psp_eai_is_admin()))))));
drop policy if exists "psp_v340_authenticated_insert" on public."ea_indicator_versions";
create policy "psp_v340_authenticated_insert" on public."ea_indicator_versions" as permissive for insert to authenticated with check (psp_eai_is_admin());
drop policy if exists "psp_v340_authenticated_update" on public."ea_indicator_versions";
create policy "psp_v340_authenticated_update" on public."ea_indicator_versions" as permissive for update to authenticated using (psp_eai_is_admin()) with check (psp_eai_is_admin());
drop policy if exists "psp_v340_authenticated_delete" on public."ea_indicator_versions";
create policy "psp_v340_authenticated_delete" on public."ea_indicator_versions" as permissive for delete to authenticated using (psp_eai_is_admin());

drop policy if exists "Moderators can create restrictions" on public."group_bans";
drop policy if exists "Moderators can remove restrictions" on public."group_bans";
drop policy if exists "Moderators can update restrictions" on public."group_bans";
drop policy if exists "Users can view relevant restrictions" on public."group_bans";
drop policy if exists "bans_staff_all" on public."group_bans";
drop policy if exists "psp_v340_authenticated_select" on public."group_bans";
create policy "psp_v340_authenticated_select" on public."group_bans" as permissive for select to authenticated using ((((user_id = ( SELECT auth.uid() AS uid)) OR psp_is_admin() OR psp_group_can_manage(group_id))) OR (is_mentor_or_admin()));
drop policy if exists "psp_v340_authenticated_insert" on public."group_bans";
create policy "psp_v340_authenticated_insert" on public."group_bans" as permissive for insert to authenticated with check ((psp_group_can_manage(group_id)) OR (is_mentor_or_admin()));
drop policy if exists "psp_v340_authenticated_update" on public."group_bans";
create policy "psp_v340_authenticated_update" on public."group_bans" as permissive for update to authenticated using ((psp_group_can_manage(group_id)) OR (is_mentor_or_admin())) with check ((psp_group_can_manage(group_id)) OR (is_mentor_or_admin()));
drop policy if exists "psp_v340_authenticated_delete" on public."group_bans";
create policy "psp_v340_authenticated_delete" on public."group_bans" as permissive for delete to authenticated using ((psp_group_can_manage(group_id)) OR (is_mentor_or_admin()));

drop policy if exists "Authors and moderators delete posts" on public."group_posts";
drop policy if exists "Authors and moderators update posts" on public."group_posts";
drop policy if exists "Members can create group posts" on public."group_posts";
drop policy if exists "Members can view group posts" on public."group_posts";
drop policy if exists "posts_delete" on public."group_posts";
drop policy if exists "posts_insert" on public."group_posts";
drop policy if exists "posts_update" on public."group_posts";
drop policy if exists "psp_v340_authenticated_select" on public."group_posts";
create policy "psp_v340_authenticated_select" on public."group_posts" as permissive for select to authenticated using (psp_group_can_view(group_id));
drop policy if exists "psp_v340_authenticated_insert" on public."group_posts";
create policy "psp_v340_authenticated_insert" on public."group_posts" as permissive for insert to authenticated with check ((((author_id = ( SELECT auth.uid() AS uid)) AND psp_group_can_post(group_id))) OR ((user_id = ( SELECT auth.uid() AS uid))));
drop policy if exists "psp_v340_authenticated_update" on public."group_posts";
create policy "psp_v340_authenticated_update" on public."group_posts" as permissive for update to authenticated using ((((author_id = ( SELECT auth.uid() AS uid)) OR psp_group_can_manage(group_id))) OR (((user_id = ( SELECT auth.uid() AS uid)) OR is_mentor_or_admin()))) with check ((((author_id = ( SELECT auth.uid() AS uid)) OR psp_group_can_manage(group_id))) OR (((user_id = ( SELECT auth.uid() AS uid)) OR is_mentor_or_admin())));
drop policy if exists "psp_v340_authenticated_delete" on public."group_posts";
create policy "psp_v340_authenticated_delete" on public."group_posts" as permissive for delete to authenticated using ((((author_id = ( SELECT auth.uid() AS uid)) OR psp_group_can_manage(group_id))) OR (((user_id = ( SELECT auth.uid() AS uid)) OR is_mentor_or_admin())));

drop policy if exists "Admin and PSP Mentor can create groups" on public."groups";
drop policy if exists "Members can view available groups" on public."groups";
drop policy if exists "Owners can delete groups" on public."groups";
drop policy if exists "Owners can update groups" on public."groups";
drop policy if exists "groups_staff_write" on public."groups";
drop policy if exists "psp_v340_authenticated_select" on public."groups";
create policy "psp_v340_authenticated_select" on public."groups" as permissive for select to authenticated using ((psp_group_can_view(id)) OR (((owner_id = ( SELECT auth.uid() AS uid)) OR is_admin())));
drop policy if exists "psp_v340_authenticated_insert" on public."groups";
create policy "psp_v340_authenticated_insert" on public."groups" as permissive for insert to authenticated with check (((psp_is_admin() OR (psp_is_psp_mentor() AND (owner_id = ( SELECT auth.uid() AS uid)) AND (is_official = false)))) OR (((owner_id = ( SELECT auth.uid() AS uid)) OR is_admin())));
drop policy if exists "psp_v340_authenticated_update" on public."groups";
create policy "psp_v340_authenticated_update" on public."groups" as permissive for update to authenticated using ((psp_group_can_manage(id)) OR (((owner_id = ( SELECT auth.uid() AS uid)) OR is_admin()))) with check ((psp_group_can_manage(id)) OR (((owner_id = ( SELECT auth.uid() AS uid)) OR is_admin())));
drop policy if exists "psp_v340_authenticated_delete" on public."groups";
create policy "psp_v340_authenticated_delete" on public."groups" as permissive for delete to authenticated using ((psp_group_can_manage(id)) OR (((owner_id = ( SELECT auth.uid() AS uid)) OR is_admin())));

drop policy if exists "Admins can delete logs" on public."moderation_log";
drop policy if exists "Members can create allowed logs" on public."moderation_log";
drop policy if exists "Moderators can view logs" on public."moderation_log";
drop policy if exists "moderation_staff" on public."moderation_log";
drop policy if exists "psp_v340_authenticated_select" on public."moderation_log";
create policy "psp_v340_authenticated_select" on public."moderation_log" as permissive for select to authenticated using (((psp_is_admin() OR ((group_id IS NOT NULL) AND psp_group_can_manage(group_id)))) OR (is_mentor_or_admin()));
drop policy if exists "psp_v340_authenticated_insert" on public."moderation_log";
create policy "psp_v340_authenticated_insert" on public."moderation_log" as permissive for insert to authenticated with check (((actor_id = ( SELECT auth.uid() AS uid))) OR (is_mentor_or_admin()));
drop policy if exists "psp_v340_authenticated_update" on public."moderation_log";
create policy "psp_v340_authenticated_update" on public."moderation_log" as permissive for update to authenticated using (is_mentor_or_admin()) with check (is_mentor_or_admin());
drop policy if exists "psp_v340_authenticated_delete" on public."moderation_log";
create policy "psp_v340_authenticated_delete" on public."moderation_log" as permissive for delete to authenticated using ((psp_is_admin()) OR (is_mentor_or_admin()));

drop policy if exists "Admin and PSP Mentor create notifications" on public."notifications";
drop policy if exists "Members can view available notifications" on public."notifications";
drop policy if exists "Owners can delete notifications" on public."notifications";
drop policy if exists "Owners can update notifications" on public."notifications";
drop policy if exists "staff_delete" on public."notifications";
drop policy if exists "staff_insert" on public."notifications";
drop policy if exists "staff_update" on public."notifications";
drop policy if exists "psp_v340_authenticated_select" on public."notifications";
create policy "psp_v340_authenticated_select" on public."notifications" as permissive for select to authenticated using ((psp_is_admin() OR (owner_id = ( SELECT auth.uid() AS uid)) OR ((is_official = true) AND psp_notification_matches_user(owner_id, audience))));
drop policy if exists "psp_v340_authenticated_insert" on public."notifications";
create policy "psp_v340_authenticated_insert" on public."notifications" as permissive for insert to authenticated with check ((((psp_is_admin() OR psp_is_psp_mentor()) AND (owner_id = ( SELECT auth.uid() AS uid)))) OR (is_mentor_or_admin()));
drop policy if exists "psp_v340_authenticated_update" on public."notifications";
create policy "psp_v340_authenticated_update" on public."notifications" as permissive for update to authenticated using (((psp_is_admin() OR (owner_id = ( SELECT auth.uid() AS uid)))) OR (is_mentor_or_admin())) with check (((psp_is_admin() OR (owner_id = ( SELECT auth.uid() AS uid)))) OR (is_mentor_or_admin()));
drop policy if exists "psp_v340_authenticated_delete" on public."notifications";
create policy "psp_v340_authenticated_delete" on public."notifications" as permissive for delete to authenticated using (((psp_is_admin() OR (owner_id = ( SELECT auth.uid() AS uid)))) OR (is_mentor_or_admin()));

drop policy if exists "Authors and moderators delete comments" on public."post_comments";
drop policy if exists "Authors can update comments" on public."post_comments";
drop policy if exists "Members can add post comments" on public."post_comments";
drop policy if exists "Members can view post comments" on public."post_comments";
drop policy if exists "comments_delete" on public."post_comments";
drop policy if exists "comments_insert" on public."post_comments";
drop policy if exists "psp_v340_authenticated_select" on public."post_comments";
create policy "psp_v340_authenticated_select" on public."post_comments" as permissive for select to authenticated using (psp_can_view_post(post_id));
drop policy if exists "psp_v340_authenticated_insert" on public."post_comments";
create policy "psp_v340_authenticated_insert" on public."post_comments" as permissive for insert to authenticated with check ((((author_id = ( SELECT auth.uid() AS uid)) AND psp_can_view_post(post_id))) OR ((user_id = ( SELECT auth.uid() AS uid))));
drop policy if exists "psp_v340_authenticated_update" on public."post_comments";
create policy "psp_v340_authenticated_update" on public."post_comments" as permissive for update to authenticated using (((author_id = ( SELECT auth.uid() AS uid)) OR psp_can_manage_post(post_id))) with check (((author_id = ( SELECT auth.uid() AS uid)) OR psp_can_manage_post(post_id)));
drop policy if exists "psp_v340_authenticated_delete" on public."post_comments";
create policy "psp_v340_authenticated_delete" on public."post_comments" as permissive for delete to authenticated using ((((author_id = ( SELECT auth.uid() AS uid)) OR psp_can_manage_post(post_id))) OR (((user_id = ( SELECT auth.uid() AS uid)) OR is_mentor_or_admin())));

drop policy if exists "Moderators can update reports" on public."post_reports";
drop policy if exists "Users can delete own open reports" on public."post_reports";
drop policy if exists "Users can report posts" on public."post_reports";
drop policy if exists "Users can view relevant reports" on public."post_reports";
drop policy if exists "reports_insert" on public."post_reports";
drop policy if exists "reports_staff_update" on public."post_reports";
drop policy if exists "psp_v340_authenticated_select" on public."post_reports";
create policy "psp_v340_authenticated_select" on public."post_reports" as permissive for select to authenticated using (((reporter_id = ( SELECT auth.uid() AS uid)) OR psp_is_admin() OR psp_group_can_manage(group_id)));
drop policy if exists "psp_v340_authenticated_insert" on public."post_reports";
create policy "psp_v340_authenticated_insert" on public."post_reports" as permissive for insert to authenticated with check ((((reporter_id = ( SELECT auth.uid() AS uid)) AND psp_group_can_view(group_id))) OR ((reporter_id = ( SELECT auth.uid() AS uid))));
drop policy if exists "psp_v340_authenticated_update" on public."post_reports";
create policy "psp_v340_authenticated_update" on public."post_reports" as permissive for update to authenticated using (((psp_is_admin() OR psp_group_can_manage(group_id))) OR (is_mentor_or_admin())) with check (((psp_is_admin() OR psp_group_can_manage(group_id))) OR (is_mentor_or_admin()));
drop policy if exists "psp_v340_authenticated_delete" on public."post_reports";
create policy "psp_v340_authenticated_delete" on public."post_reports" as permissive for delete to authenticated using ((((reporter_id = ( SELECT auth.uid() AS uid)) AND (status = 'open'::text)) OR psp_is_admin() OR psp_group_can_manage(group_id)));

drop policy if exists "V113 verified users read official signals" on public."signals";
drop policy if exists "psp_v157_signal_creator_insert" on public."signals";
drop policy if exists "psp_v157_signal_owner_delete" on public."signals";
drop policy if exists "psp_v157_signal_owner_update" on public."signals";
drop policy if exists "staff_delete" on public."signals";
drop policy if exists "staff_insert" on public."signals";
drop policy if exists "staff_update" on public."signals";
drop policy if exists "psp_v340_authenticated_select" on public."signals";
create policy "psp_v340_authenticated_select" on public."signals" as permissive for select to authenticated using (((is_official IS DISTINCT FROM false) AND psp_signal_user_has_access()));
drop policy if exists "psp_v340_authenticated_insert" on public."signals";
create policy "psp_v340_authenticated_insert" on public."signals" as permissive for insert to authenticated with check ((((owner_id = ( SELECT auth.uid() AS uid)) AND psp_can_manage_signals())) OR (is_mentor_or_admin()));
drop policy if exists "psp_v340_authenticated_update" on public."signals";
create policy "psp_v340_authenticated_update" on public."signals" as permissive for update to authenticated using (((((owner_id = ( SELECT auth.uid() AS uid)) AND psp_can_manage_signals()) OR psp_is_admin())) OR (is_mentor_or_admin())) with check (((((owner_id = ( SELECT auth.uid() AS uid)) AND psp_can_manage_signals()) OR psp_is_admin())) OR (is_mentor_or_admin()));
drop policy if exists "psp_v340_authenticated_delete" on public."signals";
create policy "psp_v340_authenticated_delete" on public."signals" as permissive for delete to authenticated using (((((owner_id = ( SELECT auth.uid() AS uid)) AND psp_can_manage_signals()) OR psp_is_admin())) OR (is_mentor_or_admin()));

drop policy if exists "Admins can delete support messages" on public."support_messages";
drop policy if exists "Users and admins can create support messages" on public."support_messages";
drop policy if exists "Users can view own support messages" on public."support_messages";
drop policy if exists "support_admin_update" on public."support_messages";
drop policy if exists "support_own_read" on public."support_messages";
drop policy if exists "psp_v340_authenticated_select" on public."support_messages";
create policy "psp_v340_authenticated_select" on public."support_messages" as permissive for select to authenticated using ((((user_id = ( SELECT auth.uid() AS uid)) OR psp_is_admin())) OR (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())));
drop policy if exists "psp_v340_authenticated_insert" on public."support_messages";
create policy "psp_v340_authenticated_insert" on public."support_messages" as permissive for insert to authenticated with check ((psp_is_admin() OR ((user_id = ( SELECT auth.uid() AS uid)) AND (sender = 'user'::text))));
drop policy if exists "psp_v340_authenticated_update" on public."support_messages";
create policy "psp_v340_authenticated_update" on public."support_messages" as permissive for update to authenticated using (is_admin()) with check (is_admin());
drop policy if exists "psp_v340_authenticated_delete" on public."support_messages";
create policy "psp_v340_authenticated_delete" on public."support_messages" as permissive for delete to authenticated using (psp_is_admin());

drop policy if exists "zoom_course_registrations_admin_read" on public."zoom_course_registrations";
drop policy if exists "zoom_course_registrations_own_read" on public."zoom_course_registrations";
drop policy if exists "psp_v340_authenticated_select" on public."zoom_course_registrations";
create policy "psp_v340_authenticated_select" on public."zoom_course_registrations" as permissive for select to authenticated using (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (lower(COALESCE(p.role, ''::text)) = ANY (ARRAY['admin'::text, 'owner'::text, 'super_admin'::text, 'superadmin'::text])))))) OR ((user_id = ( SELECT auth.uid() AS uid))));

drop policy if exists "zoom_webinar_catalog_admin_all" on public."zoom_webinar_catalog";
drop policy if exists "zoom_webinar_catalog_authenticated_read" on public."zoom_webinar_catalog";
drop policy if exists "psp_v340_authenticated_select" on public."zoom_webinar_catalog";
create policy "psp_v340_authenticated_select" on public."zoom_webinar_catalog" as permissive for select to authenticated using (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (lower(COALESCE(p.role, ''::text)) = ANY (ARRAY['admin'::text, 'owner'::text, 'super_admin'::text, 'superadmin'::text])))))) OR ((is_active = true)));
drop policy if exists "psp_v340_authenticated_insert" on public."zoom_webinar_catalog";
create policy "psp_v340_authenticated_insert" on public."zoom_webinar_catalog" as permissive for insert to authenticated with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (lower(COALESCE(p.role, ''::text)) = ANY (ARRAY['admin'::text, 'owner'::text, 'super_admin'::text, 'superadmin'::text]))))));
drop policy if exists "psp_v340_authenticated_update" on public."zoom_webinar_catalog";
create policy "psp_v340_authenticated_update" on public."zoom_webinar_catalog" as permissive for update to authenticated using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (lower(COALESCE(p.role, ''::text)) = ANY (ARRAY['admin'::text, 'owner'::text, 'super_admin'::text, 'superadmin'::text])))))) with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (lower(COALESCE(p.role, ''::text)) = ANY (ARRAY['admin'::text, 'owner'::text, 'super_admin'::text, 'superadmin'::text]))))));
drop policy if exists "psp_v340_authenticated_delete" on public."zoom_webinar_catalog";
create policy "psp_v340_authenticated_delete" on public."zoom_webinar_catalog" as permissive for delete to authenticated using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (lower(COALESCE(p.role, ''::text)) = ANY (ARRAY['admin'::text, 'owner'::text, 'super_admin'::text, 'superadmin'::text]))))));
