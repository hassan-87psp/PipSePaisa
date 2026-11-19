-- PipSePaisa 515 — Audit follow-up (2026-11-19)
-- Already applied to the live database via Supabase migrations.
-- Keep repository schema reproducible without modifying student or payment records.

-- Cover both Content Studio author foreign keys.
create index if not exists psp_content_script_comments_author_id_idx
  on public.psp_content_script_comments (author_id);
create index if not exists psp_content_script_versions_saved_by_idx
  on public.psp_content_script_versions (saved_by);

-- Previously all authenticated users could read all rows in public.messages.
-- Keep staff-wide access, sender access and intended official audience delivery.
drop policy if exists psp_staff_select on public.messages;
drop policy if exists psp_messages_read_scoped_v20261119 on public.messages;
create policy psp_messages_read_scoped_v20261119
  on public.messages for select to authenticated
  using (
    public.is_mentor_or_admin()
    or owner_id = (select auth.uid())
    or (
      is_official is true
      and public.psp_notification_matches_user(owner_id, audience)
    )
  );
