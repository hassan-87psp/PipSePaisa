
-- PipSePaisa V340
-- Canonicalize existing client manager ownership to the latest lead assignment
-- or explicit Admin override. This aligns Team Panel, Ad routing and owner records.

with latest_lead as (
  select distinct on (a.user_id)
    a.user_id,
    a.team_member_id,
    coalesce(a.assigned_at,a.created_at) as assigned_at
  from public.psp_lead_assignments a
  where a.user_id is not null
  order by a.user_id,coalesce(a.assigned_at,a.created_at) desc,a.created_at desc,a.id desc
),
canonical as (
  select
    l.user_id,
    coalesce(o.team_member_id,l.team_member_id) as team_member_id,
    l.assigned_at,
    case when o.team_member_id is not null then 'Admin Override' else 'Round Robin' end as source
  from latest_lead l
  left join public.psp_client_manager_override_v281 o on o.user_id=l.user_id
),
dir as (
  select
    c.user_id,c.team_member_id,c.assigned_at,c.source,
    coalesce(nullif(trim(tm.display_name),''),nullif(trim(tm.username),''),'PipSePaisa Team') as team_member_name,
    regexp_replace(coalesce(tm.whatsapp_number,''),'[^0-9]','','g') as team_member_whatsapp
  from canonical c
  join public.team_members tm on tm.id::text=c.team_member_id
  where coalesce(tm.is_active,true)=true
)
update public.psp_lead_assignments a
set team_member_id=d.team_member_id,
    team_member_name=d.team_member_name,
    team_member_whatsapp=d.team_member_whatsapp
from dir d
where a.user_id=d.user_id
  and (
    a.team_member_id is distinct from d.team_member_id
    or a.team_member_name is distinct from d.team_member_name
    or regexp_replace(coalesce(a.team_member_whatsapp,''),'[^0-9]','','g')
       is distinct from d.team_member_whatsapp
  );

with latest_lead as (
  select distinct on (a.user_id)
    a.user_id,
    a.team_member_id,
    coalesce(a.assigned_at,a.created_at) as assigned_at
  from public.psp_lead_assignments a
  where a.user_id is not null
  order by a.user_id,coalesce(a.assigned_at,a.created_at) desc,a.created_at desc,a.id desc
),
canonical as (
  select
    l.user_id,
    coalesce(o.team_member_id,l.team_member_id) as team_member_id,
    l.assigned_at,
    case when o.team_member_id is not null then 'Admin Override' else 'Round Robin' end as source
  from latest_lead l
  left join public.psp_client_manager_override_v281 o on o.user_id=l.user_id
),
dir as (
  select
    c.user_id,c.team_member_id,c.assigned_at,c.source,
    coalesce(nullif(trim(tm.display_name),''),nullif(trim(tm.username),''),'PipSePaisa Team') as team_member_name,
    regexp_replace(coalesce(tm.whatsapp_number,''),'[^0-9]','','g') as team_member_whatsapp
  from canonical c
  join public.team_members tm on tm.id::text=c.team_member_id
  where coalesce(tm.is_active,true)=true
)
update public.psp_ad_submissions_v259 s
set team_member_id=d.team_member_id,
    team_member_name=d.team_member_name,
    team_member_whatsapp=d.team_member_whatsapp
from dir d
where s.user_id=d.user_id
  and (
    s.team_member_id is distinct from d.team_member_id
    or s.team_member_name is distinct from d.team_member_name
    or regexp_replace(coalesce(s.team_member_whatsapp,''),'[^0-9]','','g')
       is distinct from d.team_member_whatsapp
  );

with latest_lead as (
  select distinct on (a.user_id)
    a.user_id,
    a.team_member_id,
    coalesce(a.assigned_at,a.created_at) as assigned_at
  from public.psp_lead_assignments a
  where a.user_id is not null
  order by a.user_id,coalesce(a.assigned_at,a.created_at) desc,a.created_at desc,a.id desc
),
canonical as (
  select
    l.user_id,
    coalesce(o.team_member_id,l.team_member_id) as team_member_id,
    l.assigned_at,
    case when o.team_member_id is not null then 'Admin Override' else 'Round Robin' end as source
  from latest_lead l
  left join public.psp_client_manager_override_v281 o on o.user_id=l.user_id
)
update public.psp_client_owner_v273 o
set team_member_id=c.team_member_id,
    source=c.source,
    assigned_at=c.assigned_at,
    updated_at=clock_timestamp()
from canonical c
where o.user_id=c.user_id
  and o.team_member_id is distinct from c.team_member_id;
