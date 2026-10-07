-- PipSePaisa V489 — harden live FreeCourse2 analytics writes.
-- Keeps the current anonymous attribution flow, but validates click tokens,
-- bounds all user-controlled fields, and makes client_id write-once.

create or replace function public.psp_fc2_form_open_v304(
  p_click_id text,
  p_course_key text default null::text,
  p_form_path text default null::text
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_click text := trim(coalesce(p_click_id,''));
  v_course text := nullif(left(trim(coalesce(p_course_key,'')),80),'');
  v_path text := nullif(left(trim(coalesce(p_form_path,'')),900),'');
begin
  if length(v_click) < 12 or length(v_click) > 140 or v_click !~ '^[A-Za-z0-9._:-]+$' then
    return false;
  end if;

  update public.psp_fc2_journeys_v303
  set form_opened_at=coalesce(form_opened_at,now()),
      target_path=coalesce(target_path,v_path),
      course_key=coalesce(course_key,v_course)
  where click_id=v_click;

  return found;
end
$function$;

create or replace function public.psp_fc2_enrollment_v304(
  p_click_id text,
  p_client_id text,
  p_course_key text default null::text
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_click text := trim(coalesce(p_click_id,''));
  v_client text := nullif(left(trim(coalesce(p_client_id,'')),80),'');
  v_course text := nullif(left(trim(coalesce(p_course_key,'')),80),'');
begin
  if length(v_click) < 12 or length(v_click) > 140 or v_click !~ '^[A-Za-z0-9._:-]+$' then
    return false;
  end if;

  update public.psp_fc2_journeys_v303
  set enrolled_at=coalesce(enrolled_at,now()),
      client_id=coalesce(client_id,v_client),
      course_key=coalesce(course_key,v_course)
  where click_id=v_click;

  return found;
end
$function$;
