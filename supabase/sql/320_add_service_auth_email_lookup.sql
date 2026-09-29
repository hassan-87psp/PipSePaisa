
create or replace function public.psp_service_auth_user_id_by_email_v320(p_email text)
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select u.id
  from auth.users u
  where lower(u.email) = lower(btrim(p_email))
  order by u.created_at asc
  limit 1
$$;

revoke execute on function public.psp_service_auth_user_id_by_email_v320(text) from public, anon, authenticated;
grant execute on function public.psp_service_auth_user_id_by_email_v320(text) to service_role;
