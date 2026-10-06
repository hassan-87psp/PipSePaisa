-- PipSePaisa V480 — restrict chart-bucket uploads while preserving user avatars.
-- Normal users may upload only files prefixed with their own auth.uid() inside avatars/.
-- General chart media remains restricted to Mentor/Admin signal managers.

begin;

alter policy "Authenticated users upload charts images"
on storage.objects
with check (
  bucket_id = 'charts'
  and (
    public.psp_can_manage_signals()
    or name like ('avatars/' || auth.uid()::text || '\\_%') escape '\\'
  )
);

alter policy "psp_charts_auth_upload"
on storage.objects
with check (
  bucket_id = 'charts'
  and (
    public.psp_can_manage_signals()
    or name like ('avatars/' || auth.uid()::text || '\\_%') escape '\\'
  )
);

commit;
