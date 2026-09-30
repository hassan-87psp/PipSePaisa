
revoke execute on function public.psp_can_view_post(uuid) from public, anon;
grant execute on function public.psp_can_view_post(uuid) to authenticated, service_role;

revoke execute on function public.psp_course_owner_is_admin(uuid) from public, anon;
grant execute on function public.psp_course_owner_is_admin(uuid) to authenticated, service_role;

revoke execute on function public.psp_group_restriction(uuid,uuid) from public, anon;
grant execute on function public.psp_group_restriction(uuid,uuid) to authenticated, service_role;

revoke execute on function public.psp_post_author_id(uuid) from public, anon;
grant execute on function public.psp_post_author_id(uuid) to authenticated, service_role;

revoke execute on function public.psp_post_group_id(uuid) from public, anon;
grant execute on function public.psp_post_group_id(uuid) to authenticated, service_role;

revoke execute on function public.psp_profile_is_admin(uuid) from public, anon;
grant execute on function public.psp_profile_is_admin(uuid) to authenticated, service_role;
