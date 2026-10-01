-- V413: fast combined Admin Users directory.
create or replace function public.psp_admin_user_directory_v413()
returns table(
  id uuid, full_name text, email text, whatsapp text, role text,
  is_premium boolean, is_banned boolean, created_at timestamptz,
  client_id text, email_verified boolean, email_verified_at timestamptz,
  submission_status text, rejection_reason text,
  admin_trial_expires_at timestamptz, approved_expires_at timestamptz,
  referral_name text, referral_slug text, referral_source text, referral_campaign text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not public.psp_is_admin() then raise exception 'Admin access required.'; end if;
  return query
  with first_signup as materialized (
    select distinct on (e.user_id)
      e.user_id,l.name,l.slug,l.source,l.campaign
    from public.tracked_link_events e
    join public.tracked_links l on l.id=e.link_id
    where e.event_type='signup' and e.user_id is not null
    order by e.user_id,e.created_at asc
  )
  select
    p.id,
    coalesce(nullif(btrim(p.full_name),''),split_part(coalesce(nullif(p.email,''),au.email,'User'),'@',1))::text,
    coalesce(nullif(p.email,''),au.email)::text,
    coalesce(
      nullif(btrim(coalesce(p.whatsapp,'')),''),
      nullif(btrim(coalesce(au.raw_user_meta_data->>'whatsapp','')),''),
      nullif(btrim(coalesce(au.raw_user_meta_data->>'phone','')),'')
    )::text,
    coalesce(p.role::text,'user')::text,
    coalesce(p.is_premium,false),
    not coalesce(p.is_active,true),
    coalesce(p.created_at,au.created_at),
    p.client_id::text,
    (coalesce(av.email_verified_at,au.email_confirmed_at) is not null),
    coalesce(av.email_verified_at,au.email_confirmed_at),
    av.submission_status::text,
    av.rejection_reason::text,
    av.admin_trial_expires_at,
    av.approved_expires_at,
    coalesce(fs.name,ml.name)::text,
    coalesce(fs.slug,ml.slug)::text,
    coalesce(fs.source,ml.source)::text,
    coalesce(fs.campaign,ml.campaign)::text
  from public.profiles p
  left join auth.users au on au.id=p.id
  left join public.account_verifications av on av.user_id=p.id
  left join first_signup fs on fs.user_id=p.id
  left join lateral (
    select l.name,l.slug,l.source,l.campaign
    from public.tracked_links l
    where fs.user_id is null
      and lower(l.slug)=lower(coalesce(
        au.raw_user_meta_data->>'referral_slug',
        au.raw_user_meta_data->>'pending_course_referral_slug',
        ''
      ))
    limit 1
  ) ml on true
  order by coalesce(p.created_at,au.created_at) desc;
end;
$function$;

revoke all on function public.psp_admin_user_directory_v413() from public, anon;
grant execute on function public.psp_admin_user_directory_v413() to authenticated, service_role;
