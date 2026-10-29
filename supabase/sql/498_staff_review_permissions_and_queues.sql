-- PipSePaisa staff review permissions V498 (2026-10-29).
-- Explicit admin-issued grants only. Mentor self-registration never grants staff access.
create table if not exists public.psp_staff_access_v498 (
 user_id uuid primary key references auth.users(id) on delete cascade,
 indicator_review boolean not null default false,
 ib_review boolean not null default false,
 ib_decide boolean not null default false,
 active boolean not null default true,
 granted_by uuid references auth.users(id),
 granted_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint ib_decide_requires_review_v498 check (not ib_decide or ib_review)
);
alter table public.psp_staff_access_v498 enable row level security;
revoke all on public.psp_staff_access_v498 from public,anon;
grant select on public.psp_staff_access_v498 to authenticated;
drop policy if exists staff_access_read_v498 on public.psp_staff_access_v498;
create policy staff_access_read_v498 on public.psp_staff_access_v498 for select to authenticated
 using (user_id=(select auth.uid()) or public.psp_eai_is_admin());

create table if not exists public.psp_staff_reviews_v498(
 id bigint generated always as identity primary key,
 review_type text not null check (review_type in ('indicator','ib')),
 subject_id uuid not null,
 recommendation text not null check (recommendation in ('recommend_approve','recommend_reject','needs_info','reviewed','approved','rejected')),
 note text not null default '',
 actor uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create index if not exists psp_staff_reviews_subject_v498 on public.psp_staff_reviews_v498(review_type,subject_id,created_at desc);
alter table public.psp_staff_reviews_v498 enable row level security;
revoke all on public.psp_staff_reviews_v498 from public,anon;
grant select on public.psp_staff_reviews_v498 to authenticated;
drop policy if exists staff_reviews_read_v498 on public.psp_staff_reviews_v498;
create policy staff_reviews_read_v498 on public.psp_staff_reviews_v498 for select to authenticated
 using (actor=(select auth.uid()) or public.psp_eai_is_admin());

create or replace function public.psp_staff_can_v498(p_scope text)
returns boolean language sql stable security definer set search_path='' as $$
 select public.psp_eai_is_admin() or exists(
  select 1 from public.psp_staff_access_v498 s
  where s.user_id=auth.uid() and s.active
    and case p_scope when 'indicator' then s.indicator_review
                     when 'ib' then s.ib_review
                     when 'ib_decide' then s.ib_review and s.ib_decide
                     else false end
 );
$$;
revoke all on function public.psp_staff_can_v498(text) from public,anon;
grant execute on function public.psp_staff_can_v498(text) to authenticated;

create or replace function public.psp_staff_grant_v498(
 p_email text,p_indicator_review boolean,p_ib_review boolean,p_ib_decide boolean,p_active boolean default true)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_id uuid;v_email text;
begin
 if not public.psp_eai_is_admin() then raise exception 'Admin required';end if;
 if not p_ib_review and p_ib_decide then raise exception 'IB decision requires IB review permission';end if;
 select p.id,p.email into v_id,v_email from public.profiles p
 where lower(trim(p.email))=lower(trim(p_email)) limit 1;
 if v_id is null then raise exception 'No existing user matches this email';end if;
 insert into public.psp_staff_access_v498(user_id,indicator_review,ib_review,ib_decide,active,granted_by,updated_at)
 values(v_id,p_indicator_review,p_ib_review,p_ib_decide,p_active,auth.uid(),now())
 on conflict(user_id) do update set indicator_review=excluded.indicator_review,
 ib_review=excluded.ib_review,ib_decide=excluded.ib_decide,active=excluded.active,
 granted_by=excluded.granted_by,updated_at=now();
 return jsonb_build_object('success',true,'email',v_email,'indicator_review',p_indicator_review,'ib_review',p_ib_review,'ib_decide',p_ib_decide,'active',p_active);
end;$$;
revoke all on function public.psp_staff_grant_v498(text,boolean,boolean,boolean,boolean) from public,anon;
grant execute on function public.psp_staff_grant_v498(text,boolean,boolean,boolean,boolean) to authenticated;

create or replace function public.psp_staff_my_v498()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'indicator_review',public.psp_staff_can_v498('indicator'),
  'ib_review',public.psp_staff_can_v498('ib'),
  'ib_decide',public.psp_staff_can_v498('ib_decide'));
$$;
revoke all on function public.psp_staff_my_v498() from public,anon;
grant execute on function public.psp_staff_my_v498() to authenticated;

create or replace function public.psp_staff_list_v498()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare out_json jsonb;
begin
 if not public.psp_eai_is_admin() then raise exception 'Admin only';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]'::jsonb) into out_json
 from (select p.email,p.full_name,s.indicator_review,s.ib_review,s.ib_decide,s.active,s.updated_at
 from public.psp_staff_access_v498 s join public.profiles p on p.id=s.user_id) x;
 return out_json;
end;$$;
revoke all on function public.psp_staff_list_v498() from public,anon;
grant execute on function public.psp_staff_list_v498() to authenticated;

create or replace function public.psp_staff_queue_v498(p_kind text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if p_kind='indicator' then
  if not public.psp_staff_can_v498('indicator') then raise exception 'Indicator review permission required';end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into result from(
   select r.id,r.product_id,r.user_id,r.broker,r.trading_account_id,
    r.status,r.created_at,r.updated_at,r.deposit_amount,r.licensed_version,r.license_expires_at,
    r.licensed_file_name, p.full_name,p.email,product.title as product_title,product.platform,
    product.requirements->>'min_deposit_usd' as minimum_deposit,
    av.submission_status as ib_status,av.available_deposit as verified_deposit,av.approved_expires_at,
    case when av.user_id is null then 'missing'
      when av.submission_status<>'approved' then coalesce(av.submission_status,'pending')
      when av.approved_expires_at is not null and av.approved_expires_at<=now() then 'expired'
      when av.available_deposit < coalesce(nullif(product.requirements->>'min_deposit_usd','')::numeric,0) then 'insufficient'
      else 'verified' end as verification_state
   from public.ea_indicator_requests r
   join public.ea_indicator_products product on product.id=r.product_id
   left join public.profiles p on p.id=r.user_id
   left join lateral(
     select a.user_id,a.submission_status,a.available_deposit,a.approved_expires_at
     from public.account_verifications a
     where a.user_id=r.user_id and lower(trim(a.broker))=lower(trim(r.broker))
     and trim(a.trading_account_id)=trim(r.trading_account_id)
     limit 1
   ) av on true
   order by r.created_at desc limit 300
  )x;
 elsif p_kind='ib' then
  if not public.psp_staff_can_v498('ib') then raise exception 'IB review permission required';end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into result from(
   select a.user_id,a.broker,a.trading_account_id,a.available_deposit,a.submission_status,
    a.submitted_at,a.created_at,a.reviewed_at,a.approved_expires_at,a.proof_path,a.deposit_proof_path,
    a.rejection_reason,p.full_name,p.email
   from public.account_verifications a left join public.profiles p on p.id=a.user_id
   where a.submission_status<>'not_submitted'
   order by coalesce(a.submitted_at,a.created_at) desc limit 300
  )x;
 else raise exception 'Invalid queue type'; end if;
 return coalesce(result,'[]'::jsonb);
end;$$;
revoke all on function public.psp_staff_queue_v498(text) from public,anon;
grant execute on function public.psp_staff_queue_v498(text) to authenticated;

create or replace function public.psp_staff_note_v498(
 p_kind text,p_subject uuid,p_recommendation text,p_note text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_scope text;v_exists boolean;
begin
 v_scope=case p_kind when 'indicator' then 'indicator' when 'ib' then 'ib' else null end;
 if v_scope is null or not public.psp_staff_can_v498(v_scope) then raise exception 'Reviewer permission required';end if;
 if p_recommendation not in ('recommend_approve','recommend_reject','needs_info','reviewed')
 then raise exception 'Invalid recommendation';end if;
 if p_recommendation in ('recommend_reject','needs_info') and length(trim(coalesce(p_note,'')))<5
 then raise exception 'Please explain the recommendation';end if;
 if length(coalesce(p_note,''))>1500 then raise exception 'Review note too long';end if;
 if p_kind='indicator' then
  select exists(select 1 from public.ea_indicator_requests where id=p_subject) into v_exists;
 else select exists(select 1 from public.account_verifications where user_id=p_subject) into v_exists;end if;
 if not v_exists then raise exception 'Request not found';end if;
 insert into public.psp_staff_reviews_v498(review_type,subject_id,recommendation,note,actor)
 values(p_kind,p_subject,p_recommendation,coalesce(trim(p_note),''),auth.uid());
 return jsonb_build_object('success',true,'action',p_recommendation);
end;$$;
revoke all on function public.psp_staff_note_v498(text,uuid,text,text) from public,anon;
grant execute on function public.psp_staff_note_v498(text,uuid,text,text) to authenticated;

create or replace function public.psp_staff_ib_decide_v498(
 p_user_id uuid,p_action text,p_reason text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare row_rec record;v_action text:=lower(trim(p_action));v_reason text:=trim(coalesce(p_reason,''));
begin
 if not public.psp_staff_can_v498('ib_decide') then raise exception 'IB decision permission required';end if;
 if v_action not in ('approve','reject') then raise exception 'Invalid decision';end if;
 select * into row_rec from public.account_verifications where user_id=p_user_id for update;
 if not found then raise exception 'Verification not found';end if;
 if row_rec.submission_status not in ('pending','under_review','submitted','rejected')
 then raise exception 'This account is not awaiting verification. Admin review required.';end if;
 if v_action='approve' then
  if lower(trim(coalesce(row_rec.broker,''))) not in ('exness','xm','dprime','d prime','doo prime')
   or length(trim(coalesce(row_rec.trading_account_id,'')))<4
   or coalesce(row_rec.available_deposit,0)<=0
   or (nullif(row_rec.proof_path,'') is null and nullif(row_rec.deposit_proof_path,'') is null)
  then raise exception 'Account, broker, deposit and proof must be verified before approval';end if;
 else if length(v_reason)<5 then raise exception 'Rejection reason required';end if;end if;
 update public.account_verifications set submission_status=case when v_action='approve' then 'approved' else 'rejected' end,
  reviewed_by=auth.uid(),reviewed_at=now(),rejection_reason=case when v_action='reject' then v_reason else null end,
  approved_expires_at=case when v_action='approve' then now()+interval '30 days' else null end,
  updated_at=now()
 where user_id=p_user_id;
 insert into public.psp_staff_reviews_v498(review_type,subject_id,recommendation,note,actor)
 values('ib',p_user_id,case when v_action='approve' then 'approved' else 'rejected' end,v_reason,auth.uid());
 return jsonb_build_object('success',true,'status',case when v_action='approve' then 'approved' else 'rejected' end);
end;$$;
revoke all on function public.psp_staff_ib_decide_v498(uuid,text,text) from public,anon;
grant execute on function public.psp_staff_ib_decide_v498(uuid,text,text) to authenticated;

-- Signed proof access is limited to individually approved staff + matching request file records.
drop policy if exists psp_staff_verification_proofs_v498 on storage.objects;
create policy psp_staff_verification_proofs_v498 on storage.objects for select to authenticated
 using (bucket_id='verification-proofs' and public.psp_staff_can_v498('ib')
  and exists(select 1 from public.account_verifications v
   where v.proof_path=objects.name or v.deposit_proof_path=objects.name));
drop policy if exists psp_staff_indicator_proofs_v498 on storage.objects;
create policy psp_staff_indicator_proofs_v498 on storage.objects for select to authenticated
 using (bucket_id='ea-indicator-proofs' and public.psp_staff_can_v498('indicator')
  and exists(select 1 from public.ea_indicator_requests r
   where r.deposit_proof_path=objects.name or r.payment_proof_path=objects.name));

-- Navigation toggles alone do not grant data access.
insert into public.mentor_access_settings(key,enabled,description)
values('indicator_review',true,'Show EA & Indicator review to explicitly granted staff'),
      ('ib_review',true,'Show IB verification review to explicitly granted staff')
on conflict(key) do update set enabled=excluded.enabled,description=excluded.description;
