-- PipSePaisa v504: storage path authorization must bypass request RLS AFTER checking named staff grants.
-- Avoid joins to customer request tables inside storage RLS policies: those are not SELECT-visible to mentors.
CREATE OR REPLACE FUNCTION public.psp_staff_storage_allowed_v504(
 p_bucket text,p_name text,p_purpose text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE user_folder text; request_folder text;
BEGIN
 IF auth.uid() IS NULL OR p_name IS NULL OR p_bucket IS NULL THEN RETURN false;END IF;
 IF p_purpose='website_proof' AND p_bucket='verification-proofs' THEN
  IF NOT public.psp_staff_can_v498('ib') THEN RETURN false;END IF;
  RETURN EXISTS (SELECT 1 FROM public.account_verifications a
    WHERE a.proof_path=p_name OR a.deposit_proof_path=p_name);
 END IF;
 IF p_purpose='indicator_proof' AND p_bucket='ea-indicator-proofs' THEN
  IF NOT public.psp_staff_can_v498('indicator') THEN RETURN false;END IF;
  RETURN EXISTS (SELECT 1 FROM public.ea_indicator_requests r
    WHERE r.deposit_proof_path=p_name OR r.payment_proof_path=p_name);
 END IF;
 IF p_purpose='indicator_license' AND p_bucket='ea-indicator-licensed' THEN
  IF NOT public.psp_staff_can_v498('indicator_issue') THEN RETURN false;END IF;
  user_folder:=(storage.foldername(p_name))[1];
  request_folder:=(storage.foldername(p_name))[2];
  IF user_folder IS NULL OR request_folder IS NULL
    OR user_folder !~ '^[a-fA-F0-9-]{36}$' OR request_folder !~ '^[a-fA-F0-9-]{36}$'
    OR lower(p_name) !~ '\.(ex4|ex5|zip)$'
  THEN RETURN false;END IF;
  RETURN EXISTS(SELECT 1 FROM public.ea_indicator_requests r
    WHERE r.user_id::text=user_folder AND r.id::text=request_folder);
 END IF;
 RETURN false;
END;$$;
REVOKE ALL ON FUNCTION public.psp_staff_storage_allowed_v504(text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.psp_staff_storage_allowed_v504(text,text,text) TO authenticated;

DROP POLICY IF EXISTS psp_staff_verification_proofs_v498 ON storage.objects;
CREATE POLICY psp_staff_verification_proofs_v498 ON storage.objects FOR SELECT TO authenticated
 USING (public.psp_staff_storage_allowed_v504(bucket_id,name,'website_proof'));

DROP POLICY IF EXISTS psp_staff_indicator_proofs_v498 ON storage.objects;
CREATE POLICY psp_staff_indicator_proofs_v498 ON storage.objects FOR SELECT TO authenticated
 USING (public.psp_staff_storage_allowed_v504(bucket_id,name,'indicator_proof'));

DROP POLICY IF EXISTS psp_staff_issue_upload_v501 ON storage.objects;
CREATE POLICY psp_staff_issue_upload_v501 ON storage.objects FOR INSERT TO authenticated
 WITH CHECK (bucket_id='ea-indicator-licensed'
  AND owner_id=auth.uid()::text
  AND public.psp_staff_storage_allowed_v504(bucket_id,name,'indicator_license'));

DROP POLICY IF EXISTS psp_staff_issue_cleanup_select_v501 ON storage.objects;
CREATE POLICY psp_staff_issue_cleanup_select_v501 ON storage.objects FOR SELECT TO authenticated
 USING (bucket_id='ea-indicator-licensed'
  AND owner_id=auth.uid()::text
  AND public.psp_staff_storage_allowed_v504(bucket_id,name,'indicator_license'));

DROP POLICY IF EXISTS psp_staff_issue_cleanup_delete_v501 ON storage.objects;
CREATE POLICY psp_staff_issue_cleanup_delete_v501 ON storage.objects FOR DELETE TO authenticated
 USING (bucket_id='ea-indicator-licensed'
  AND owner_id=auth.uid()::text
  AND public.psp_staff_storage_allowed_v504(bucket_id,name,'indicator_license'));
