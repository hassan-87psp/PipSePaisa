
create or replace function public.psp_sync_ad_submission_assignment_v343()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.psp_ad_submissions_v259 s
     set team_member_id = new.team_member_id,
         team_member_name = new.team_member_name,
         team_member_whatsapp = new.team_member_whatsapp
   where s.assignment_id = new.id
     and (
       nullif(trim(coalesce(s.team_member_id,'')),'') is distinct from nullif(trim(coalesce(new.team_member_id,'')),'')
       or nullif(trim(coalesce(s.team_member_name,'')),'') is distinct from nullif(trim(coalesce(new.team_member_name,'')),'')
       or nullif(trim(coalesce(s.team_member_whatsapp,'')),'') is distinct from nullif(trim(coalesce(new.team_member_whatsapp,'')),'')
     );
  return new;
end;
$$;

revoke execute on function public.psp_sync_ad_submission_assignment_v343() from public, anon, authenticated;
grant execute on function public.psp_sync_ad_submission_assignment_v343() to service_role;

drop trigger if exists trg_psp_sync_ad_submission_assignment_v343 on public.psp_lead_assignments;
create trigger trg_psp_sync_ad_submission_assignment_v343
after update of team_member_id, team_member_name, team_member_whatsapp
on public.psp_lead_assignments
for each row
when (
  old.team_member_id is distinct from new.team_member_id
  or old.team_member_name is distinct from new.team_member_name
  or old.team_member_whatsapp is distinct from new.team_member_whatsapp
)
execute function public.psp_sync_ad_submission_assignment_v343();

update public.psp_ad_submissions_v259 s
   set team_member_id = a.team_member_id,
       team_member_name = a.team_member_name,
       team_member_whatsapp = a.team_member_whatsapp
  from public.psp_lead_assignments a
 where a.id = s.assignment_id
   and (
     nullif(trim(coalesce(s.team_member_id,'')),'') is distinct from nullif(trim(coalesce(a.team_member_id,'')),'')
     or nullif(trim(coalesce(s.team_member_name,'')),'') is distinct from nullif(trim(coalesce(a.team_member_name,'')),'')
     or nullif(trim(coalesce(s.team_member_whatsapp,'')),'') is distinct from nullif(trim(coalesce(a.team_member_whatsapp,'')),'')
   );
