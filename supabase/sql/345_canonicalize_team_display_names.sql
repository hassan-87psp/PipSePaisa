
update public.team_members
set display_name = case id::text
  when 'a09b45b4-5afe-4c5f-ba1c-69caf68a85b6' then 'Ms Amal FX'
  when 'b5a6aa1a-e475-46b6-9cef-e7ec7b902bd2' then 'Ms Samiya FX'
  when 'c3391ef6-3b73-44dc-b7c3-3f192048447a' then 'Ms Memoona'
  else display_name
end,
updated_at = clock_timestamp()
where id::text in (
  'a09b45b4-5afe-4c5f-ba1c-69caf68a85b6',
  'b5a6aa1a-e475-46b6-9cef-e7ec7b902bd2',
  'c3391ef6-3b73-44dc-b7c3-3f192048447a'
);

update public.psp_lead_assignments
set team_member_name = case team_member_id
  when 'a09b45b4-5afe-4c5f-ba1c-69caf68a85b6' then 'Ms Amal FX'
  when 'b5a6aa1a-e475-46b6-9cef-e7ec7b902bd2' then 'Ms Samiya FX'
  when 'c3391ef6-3b73-44dc-b7c3-3f192048447a' then 'Ms Memoona'
  else team_member_name
end
where team_member_id in (
  'a09b45b4-5afe-4c5f-ba1c-69caf68a85b6',
  'b5a6aa1a-e475-46b6-9cef-e7ec7b902bd2',
  'c3391ef6-3b73-44dc-b7c3-3f192048447a'
);

update public.psp_ad_submissions_v259
set team_member_name = case team_member_id
  when 'a09b45b4-5afe-4c5f-ba1c-69caf68a85b6' then 'Ms Amal FX'
  when 'b5a6aa1a-e475-46b6-9cef-e7ec7b902bd2' then 'Ms Samiya FX'
  when 'c3391ef6-3b73-44dc-b7c3-3f192048447a' then 'Ms Memoona'
  else team_member_name
end
where team_member_id in (
  'a09b45b4-5afe-4c5f-ba1c-69caf68a85b6',
  'b5a6aa1a-e475-46b6-9cef-e7ec7b902bd2',
  'c3391ef6-3b73-44dc-b7c3-3f192048447a'
);

update public.psp_fc2_enrollment_cache_v307
set team_member_name = case lower(regexp_replace(coalesce(team_member_name,''),'[^a-zA-Z]','','g'))
  when 'missamal' then 'Ms Amal FX'
  when 'msamalfx' then 'Ms Amal FX'
  when 'misssamiya' then 'Ms Samiya FX'
  when 'mssamiyafx' then 'Ms Samiya FX'
  when 'memoonafx' then 'Ms Memoona'
  when 'msmemoona' then 'Ms Memoona'
  else team_member_name
end
where lower(regexp_replace(coalesce(team_member_name,''),'[^a-zA-Z]','','g'))
  in ('missamal','msamalfx','misssamiya','mssamiyafx','memoonafx','msmemoona');
