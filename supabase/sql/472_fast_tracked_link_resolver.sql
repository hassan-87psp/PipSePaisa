create or replace function public.psp_resolve_tracked_link(p_slug text)
returns table(
  link_id uuid,
  link_name text,
  destination_path text,
  source text,
  campaign text
)
language sql
security definer
set search_path = public, auth
stable
as $$
  select tl.id, tl.name, tl.destination_path, tl.source, tl.campaign
  from public.tracked_links tl
  where lower(tl.slug) = lower(trim(coalesce(p_slug,'')))
    and tl.is_active = true
  limit 1
$$;

revoke all on function public.psp_resolve_tracked_link(text) from public;
grant execute on function public.psp_resolve_tracked_link(text) to anon, authenticated;
