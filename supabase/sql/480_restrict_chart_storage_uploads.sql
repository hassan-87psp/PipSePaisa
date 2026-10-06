-- PipSePaisa V480 — restrict public chart-bucket uploads to trusted content managers.
begin;

alter policy "Authenticated users upload charts images"
on storage.objects
with check (
  bucket_id = 'charts'
  and public.psp_can_manage_signals()
);

alter policy "psp_charts_auth_upload"
on storage.objects
with check (
  bucket_id = 'charts'
  and public.psp_can_manage_signals()
);

commit;
