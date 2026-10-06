-- PipSePaisa V478 — public Ad Link enrollment must not overwrite
-- canonical identity/contact data for an existing PipSePaisa account.

create or replace function public.psp_ad_ensure_enrollment_v268(
  p_user_id uuid,
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_course_code text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_code text:=lower(trim(coalesce(p_course_code,'')));
  v_course_key text;
  v_batch_key text;
  v_course_name text;
  v_enrollment_id uuid;
  v_full_name text;
  v_email text;
  v_whatsapp text;
begin
  if p_user_id is null then raise exception 'User ID is required.'; end if;

  if v_code='technical' then
    v_course_key:='basic-b2';
    v_batch_key:='basic_b3';
    v_course_name:='Sir Sajid Khan Ghori Free Course — Batch 3';
  elsif v_code='fundamental' then
    v_course_key:='fundamental';
    v_batch_key:='fundamental_b2';
    v_course_name:='Sir Malik Ghulam Abbas Free Course — Batch 2';
  else
    raise exception 'Invalid Ad Link course.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text||':'||v_code||':'||v_batch_key,0));

  select
    nullif(trim(p.full_name),''),
    nullif(lower(trim(p.email)),''),
    nullif(regexp_replace(coalesce(p.whatsapp,''),'[^0-9+]','','g'),'')
  into v_full_name,v_email,v_whatsapp
  from public.profiles p
  where p.id=p_user_id;

  v_full_name:=coalesce(v_full_name,nullif(trim(p_full_name),''));
  v_email:=coalesce(v_email,nullif(lower(trim(p_email)),''));
  v_whatsapp:=coalesce(v_whatsapp,nullif(regexp_replace(coalesce(p_whatsapp,''),'[^0-9+]','','g'),''));

  perform set_config('request.jwt.claim.sub',p_user_id::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',p_user_id::text,'role','authenticated','email',coalesce(v_email,''))::text,
    true
  );

  select e.id into v_enrollment_id
  from public.course_enrollments e
  where e.user_id=p_user_id
    and lower(trim(coalesce(e.psp_batch_key,'')))=v_batch_key
    and (
      (v_code='technical' and lower(trim(coalesce(e.course_key,'')))
        in ('basic','basic-b2','basic-b3','basic-batch-2'))
      or
      (v_code='fundamental' and lower(trim(coalesce(e.course_key,'')))
        in ('fundamental','fundamental-b2','fundamental-b1'))
    )
  order by
    case when lower(trim(coalesce(e.course_key,'')))=v_course_key then 0 else 1 end,
    e.created_at asc nulls last,
    e.id asc
  limit 1;

  if v_enrollment_id is null then
    insert into public.course_enrollments(
      user_id,course_key,course_name,course_type,price,currency,
      full_name,email,whatsapp,payment_status,enrollment_status,
      access_granted_at,psp_batch_key,created_at,updated_at
    ) values (
      p_user_id,v_course_key,v_course_name,'free',0,'USD',
      v_full_name,v_email,v_whatsapp,
      'not_required','enrolled',clock_timestamp(),v_batch_key,
      clock_timestamp(),clock_timestamp()
    )
    returning id into v_enrollment_id;
  end if;

  update public.course_enrollments e
  set course_name=v_course_name,
      full_name=coalesce(v_full_name,e.full_name),
      email=coalesce(v_email,e.email),
      whatsapp=coalesce(v_whatsapp,e.whatsapp),
      payment_status='not_required',
      enrollment_status='enrolled',
      access_granted_at=coalesce(e.access_granted_at,clock_timestamp()),
      psp_batch_key=v_batch_key,
      updated_at=clock_timestamp()
  where e.id=v_enrollment_id;

  return v_enrollment_id;
end;
$function$;
