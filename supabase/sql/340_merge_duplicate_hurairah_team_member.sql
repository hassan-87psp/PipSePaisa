
-- Merge accidental duplicate Team Member hurariahfx into the original Hurairah account.
-- Preserve the old tracking link and audit the single client transfer.

insert into public.psp_client_transfer_log_v273(
  client_key,old_team_member_id,new_team_member_id,changed_by,note
)
select
  o.client_key,
  '366f3eae-b861-4d23-b4a8-890b5c377000',
  '3ae7dfee-ac85-4d49-a5ac-66c75684278c',
  null,
  'System cleanup: merged duplicate team member hurariahfx into Hurairah'
from public.psp_client_owner_v273 o
where o.team_member_id='366f3eae-b861-4d23-b4a8-890b5c377000'
  and not exists (
    select 1
    from public.psp_client_transfer_log_v273 l
    where l.client_key=o.client_key
      and l.old_team_member_id='366f3eae-b861-4d23-b4a8-890b5c377000'
      and l.new_team_member_id='3ae7dfee-ac85-4d49-a5ac-66c75684278c'
      and coalesce(l.note,'')='System cleanup: merged duplicate team member hurariahfx into Hurairah'
  );

update public.psp_client_owner_v273
set team_member_id='3ae7dfee-ac85-4d49-a5ac-66c75684278c',
    source='Duplicate Manager Merge',
    updated_at=clock_timestamp()
where team_member_id='366f3eae-b861-4d23-b4a8-890b5c377000';

update public.team_client_attribution_v206
set team_member_id='3ae7dfee-ac85-4d49-a5ac-66c75684278c',
    updated_at=clock_timestamp()
where team_member_id='366f3eae-b861-4d23-b4a8-890b5c377000';

update public.tracked_links
set assigned_team_member_id='3ae7dfee-ac85-4d49-a5ac-66c75684278c'
where id='1cba59a2-237a-4a51-8519-4454019fbf16'
  and assigned_team_member_id is distinct from '3ae7dfee-ac85-4d49-a5ac-66c75684278c';

update public.team_members
set is_active=false,
    lead_distribution_enabled=false,
    updated_at=clock_timestamp()
where id='366f3eae-b861-4d23-b4a8-890b5c377000'::uuid;
