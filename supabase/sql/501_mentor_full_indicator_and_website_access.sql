-- PipSePaisa V501: Licensed mentor issuing and WEBSITE ACCESS approvals.
-- Existing admin functions, customer download policies and licensed files remain intact.
ALTER TABLE public.psp_staff_access_v498
  ADD COLUMN IF NOT EXISTS indicator_issue boolean NOT NULL DEFAULT false;
DO $do$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='psp_staff_issue_requires_review_v501') THEN
  ALTER TABLE public.psp_staff_access_v498
   ADD CONSTRAINT psp_staff_issue_requires_review_v501 CHECK (NOT indicator_issue OR indicator_review);
 END IF;
END $do$;

CREATE OR REPLACE FUNCTION public.psp_staff_can_v498(p_scope text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.psp_staff_is_admin_v499() OR EXISTS (
  SELECT 1 FROM public.psp_staff_access_v498 s
  WHERE s.user_id=auth.uid() AND s.active
  AND CASE p_scope
    WHEN 'indicator' THEN s.indicator_review
    WHEN 'indicator_issue' THEN s.indicator_review AND s.indicator_issue
    WHEN 'ib' THEN s.ib_review
    WHEN 'ib_decide' THEN s.ib_review AND s.ib_decide
    ELSE false END
 );
$$;
REVOKE ALL ON FUNCTION public.psp_staff_can_v498(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.psp_staff_can_v498(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.psp_staff_my_v498()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object(
  'indicator_review',public.psp_staff_can_v498('indicator'),
  'indicator_issue',public.psp_staff_can_v498('indicator_issue'),
  'ib_review',public.psp_staff_can_v498('ib'),
  'ib_decide',public.psp_staff_can_v498('ib_decide'));
$$;
REVOKE ALL ON FUNCTION public.psp_staff_my_v498() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.psp_staff_my_v498() TO authenticated;

-- New version keeps the V498 signature untouched for old clients.
CREATE OR REPLACE FUNCTION public.psp_staff_grant_v501(
 p_email text, p_indicator_review boolean, p_indicator_issue boolean,
 p_ib_review boolean, p_ib_decide boolean, p_active boolean DEFAULT true)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid; v_email text; v_role text;
BEGIN
 IF NOT public.psp_staff_is_admin_v499() THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF p_indicator_issue AND NOT p_indicator_review THEN RAISE EXCEPTION 'File issuing requires indicator review'; END IF;
 IF p_ib_decide AND NOT p_ib_review THEN RAISE EXCEPTION 'Access decisions require website access review'; END IF;
 SELECT p.id,p.email,p.role INTO v_id,v_email,v_role FROM public.profiles p
  WHERE lower(trim(p.email))=lower(trim(p_email)) LIMIT 1;
 IF v_id IS NULL THEN RAISE EXCEPTION 'Existing reviewer account not found'; END IF;
 IF lower(coalesce(v_role,'')) NOT IN ('mentor','psp_mentor','pspmentor','admin','super_admin','superadmin') THEN
  RAISE EXCEPTION 'Account must first have approved Mentor or Admin role';
 END IF;
 INSERT INTO public.psp_staff_access_v498
  (user_id,indicator_review,indicator_issue,ib_review,ib_decide,active,granted_by,updated_at)
 VALUES (v_id,p_indicator_review,p_indicator_issue,p_ib_review,p_ib_decide,p_active,auth.uid(),now())
 ON CONFLICT(user_id) DO UPDATE SET
  indicator_review=excluded.indicator_review,
  indicator_issue=excluded.indicator_issue,
  ib_review=excluded.ib_review,ib_decide=excluded.ib_decide,
  active=excluded.active,granted_by=excluded.granted_by,updated_at=now();
 RETURN jsonb_build_object('success',true,'email',v_email,'active',p_active);
END;$$;
REVOKE ALL ON FUNCTION public.psp_staff_grant_v501(text,boolean,boolean,boolean,boolean,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.psp_staff_grant_v501(text,boolean,boolean,boolean,boolean,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.psp_staff_list_v498()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.psp_staff_is_admin_v499() THEN RAISE EXCEPTION 'Admin only';END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.updated_at DESC),'[]'::jsonb) INTO result
 FROM (SELECT p.email,p.full_name,s.indicator_review,s.indicator_issue,
       s.ib_review,s.ib_decide,s.active,s.updated_at
       FROM public.psp_staff_access_v498 s JOIN public.profiles p ON p.id=s.user_id) x;
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION public.psp_staff_list_v498() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.psp_staff_list_v498() TO authenticated;

-- Licensed upload: exact student/request path, staff who can issue, compiled file only.
DROP POLICY IF EXISTS psp_staff_issue_upload_v501 ON storage.objects;
CREATE POLICY psp_staff_issue_upload_v501 ON storage.objects FOR INSERT TO authenticated
 WITH CHECK (bucket_id='ea-indicator-licensed'
 AND public.psp_staff_can_v498('indicator_issue')
 AND owner_id=auth.uid()::text
 AND lower(name) ~ '\.(ex4|ex5|zip)$'
 AND EXISTS (
  SELECT 1 FROM public.ea_indicator_requests r
  WHERE (storage.foldername(name))[1]=r.user_id::text
   AND (storage.foldername(name))[2]=r.id::text
 ));
-- Scoped cleanup of failed uploads; no blanket read access to other licensed files.
DROP POLICY IF EXISTS psp_staff_issue_cleanup_select_v501 ON storage.objects;
CREATE POLICY psp_staff_issue_cleanup_select_v501 ON storage.objects FOR SELECT TO authenticated
 USING (bucket_id='ea-indicator-licensed'
 AND public.psp_staff_can_v498('indicator_issue') AND owner_id=auth.uid()::text
 AND EXISTS(SELECT 1 FROM public.ea_indicator_requests r
   WHERE (storage.foldername(name))[1]=r.user_id::text
   AND (storage.foldername(name))[2]=r.id::text));
DROP POLICY IF EXISTS psp_staff_issue_cleanup_delete_v501 ON storage.objects;
CREATE POLICY psp_staff_issue_cleanup_delete_v501 ON storage.objects FOR DELETE TO authenticated
 USING (bucket_id='ea-indicator-licensed'
 AND public.psp_staff_can_v498('indicator_issue') AND owner_id=auth.uid()::text
 AND EXISTS(SELECT 1 FROM public.ea_indicator_requests r
  WHERE (storage.foldername(name))[1]=r.user_id::text
  AND (storage.foldername(name))[2]=r.id::text));

-- Single server-side transaction for reviewer decisions + personal-file issuance.
CREATE OR REPLACE FUNCTION public.psp_staff_indicator_decide_v501(
 p_request_id uuid,p_action text,p_note text DEFAULT '',
 p_file_path text DEFAULT NULL,p_file_name text DEFAULT NULL,
 p_version text DEFAULT NULL,p_expiry date DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_req public.ea_indicator_requests%ROWTYPE;
 v_product public.ea_indicator_products%ROWTYPE;
 v_verified record;
 v_action text:=lower(trim(coalesce(p_action,'')));
 v_note text:=trim(coalesce(p_note,''));
 v_ext text;
 v_path text:=nullif(trim(coalesce(p_file_path,'')),'');
 v_size numeric;
 v_now timestamptz:=now();
 v_approved boolean:=false;
BEGIN
 IF NOT public.psp_staff_can_v498('indicator_issue') THEN
  RAISE EXCEPTION 'Indicator issuing permission required';END IF;
 IF v_action NOT IN ('under_review','approve','reject','deliver') THEN RAISE EXCEPTION 'Invalid review action';END IF;
 IF length(v_note)>1500 THEN RAISE EXCEPTION 'Note too long';END IF;
 IF v_action='reject' AND length(v_note)<5 THEN RAISE EXCEPTION 'A rejection reason is required';END IF;
 SELECT * INTO v_req FROM public.ea_indicator_requests WHERE id=p_request_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Indicator application not found';END IF;
 SELECT * INTO v_product FROM public.ea_indicator_products WHERE id=v_req.product_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Software product not found';END IF;
 IF v_action IN ('approve','deliver') THEN
  SELECT a.submission_status,a.available_deposit,a.approved_expires_at INTO v_verified
   FROM public.account_verifications a
   WHERE a.user_id=v_req.user_id
     AND lower(trim(a.broker))=lower(trim(v_req.broker))
     AND trim(a.trading_account_id)=trim(v_req.trading_account_id)
   LIMIT 1;
  IF NOT FOUND OR v_verified.submission_status<>'approved'
     OR (v_verified.approved_expires_at IS NOT NULL AND v_verified.approved_expires_at<=v_now)
     OR coalesce(v_verified.available_deposit,0)<coalesce((v_product.requirements->>'min_deposit_usd')::numeric,0)
  THEN RAISE EXCEPTION 'Exact broker/account verification, valid period and required deposit must be approved'; END IF;
  IF v_product.access_type='paid' AND nullif(v_req.payment_proof_path,'') IS NULL THEN
   RAISE EXCEPTION 'Paid indicator requires payment proof';END IF;
 END IF;
 IF v_action='deliver' THEN
  IF v_path IS NULL OR p_file_name IS NULL OR trim(p_file_name)='' THEN
   RAISE EXCEPTION 'Upload an individually licensed build first';END IF;
  IF left(v_path,length(v_req.user_id::text||'/'||v_req.id::text||'/'))<>(v_req.user_id::text||'/'||v_req.id::text||'/')
   THEN RAISE EXCEPTION 'Licensed path does not match this student/request'; END IF;
  v_ext:=lower(substring(v_path from '\.([a-zA-Z0-9]+)$'));
  IF v_ext NOT IN ('ex4','ex5','zip')
     OR (v_product.platform='MT5' AND v_ext='ex4')
     OR (v_product.platform='MT4' AND v_ext='ex5')
   THEN RAISE EXCEPTION 'Invalid compiled file for software platform';END IF;
  IF length(trim(coalesce(p_version,'')))<1 OR length(p_version)>60 THEN
   RAISE EXCEPTION 'Licensed version is required';END IF;
  IF p_expiry IS NOT NULL AND p_expiry<current_date THEN
   RAISE EXCEPTION 'Expiry date must be today or later';END IF;
  SELECT (o.metadata->>'size')::numeric INTO v_size
  FROM storage.objects o
  WHERE o.bucket_id='ea-indicator-licensed'
    AND o.name=v_path AND o.owner_id=auth.uid()::text;
  IF NOT FOUND OR coalesce(v_size,0)<=0 OR v_size>15728640 THEN
   RAISE EXCEPTION 'Uploaded licensed build is missing, inaccessible, empty or over 15 MB';END IF;
 END IF;
 UPDATE public.ea_indicator_requests
 SET status=CASE v_action WHEN 'approve' THEN 'approved' WHEN 'reject' THEN 'rejected'
         WHEN 'deliver' THEN 'ready' ELSE 'under_review' END,
     admin_note=CASE WHEN v_note='' THEN admin_note ELSE v_note END,
     approved_at=CASE WHEN v_action IN ('approve','deliver') THEN v_now ELSE approved_at END,
     ready_at=CASE WHEN v_action='deliver' THEN v_now ELSE ready_at END,
     downloaded_at=CASE WHEN v_action='deliver' THEN NULL ELSE downloaded_at END,
     licensed_file_path=CASE WHEN v_action='deliver' THEN v_path ELSE licensed_file_path END,
     licensed_file_name=CASE WHEN v_action='deliver' THEN p_file_name ELSE licensed_file_name END,
     licensed_account_id=CASE WHEN v_action='deliver' THEN v_req.trading_account_id ELSE licensed_account_id END,
     licensed_version=CASE WHEN v_action='deliver' THEN p_version ELSE licensed_version END,
     license_expires_at=CASE WHEN v_action='deliver' THEN (p_expiry::timestamp + interval '1 day' - interval '1 second') AT TIME ZONE 'UTC' ELSE license_expires_at END,
     updated_at=v_now
 WHERE id=p_request_id;
 INSERT INTO public.psp_staff_reviews_v498(review_type,subject_id,recommendation,note,actor)
 VALUES ('indicator',p_request_id,CASE v_action WHEN 'approve' THEN 'approved' WHEN 'reject' THEN 'rejected' ELSE 'reviewed' END,
  CASE WHEN v_action='deliver' THEN 'Licensed build delivered: '||coalesce(p_file_name,'')||'. '||v_note ELSE v_note END,auth.uid());
 RETURN jsonb_build_object('success',true,'status',CASE v_action WHEN 'approve' THEN 'approved' WHEN 'reject' THEN 'rejected' WHEN 'deliver' THEN 'ready' ELSE 'under_review' END,'request_id',p_request_id);
END;$$;
REVOKE ALL ON FUNCTION public.psp_staff_indicator_decide_v501(uuid,text,text,text,text,text,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.psp_staff_indicator_decide_v501(uuid,text,text,text,text,text,date) TO authenticated;

-- Match the Admin Access Approvals 30-day status/expiry semantics.
CREATE OR REPLACE FUNCTION public.psp_staff_access_decide_v501(
 p_user_id uuid,p_action text,p_reason text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v public.account_verifications%ROWTYPE;
 v_action text:=lower(trim(coalesce(p_action,'')));
 v_reason text:=trim(coalesce(p_reason,''));
 v_until timestamptz;
BEGIN
 IF NOT public.psp_staff_can_v498('ib_decide') THEN
  RAISE EXCEPTION 'Website Access decision permission required';END IF;
 IF v_action NOT IN ('approve','reject') THEN RAISE EXCEPTION 'Invalid access decision';END IF;
 SELECT * INTO v FROM public.account_verifications WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND OR v.submission_status='not_submitted' THEN
   RAISE EXCEPTION 'Submitted verification request not found';END IF;
 IF v_action='reject' AND length(v_reason)<5 THEN
   RAISE EXCEPTION 'Rejection reason required';END IF;
 IF v_action='approve' THEN
  IF lower(trim(coalesce(v.broker,''))) NOT IN ('exness','xm','dprime','d prime','doo prime')
    OR length(trim(coalesce(v.trading_account_id,'')))<4
    OR coalesce(v.available_deposit,0)<=0
    OR (nullif(v.proof_path,'') IS NULL AND nullif(v.deposit_proof_path,'') IS NULL)
  THEN RAISE EXCEPTION 'Verify approved broker, account ID, deposit and deposit proof before enabling website access';END IF;
 END IF;
 v_until:=CASE WHEN v_action='approve' THEN now()+interval '30 days' ELSE NULL END;
 UPDATE public.account_verifications
 SET submission_status=CASE WHEN v_action='approve' THEN 'approved' ELSE 'rejected' END,
  rejection_reason=CASE WHEN v_action='reject' THEN v_reason ELSE NULL END,
  reviewed_by=auth.uid(),reviewed_at=now(),
  approved_expires_at=v_until,admin_trial_expires_at=NULL,updated_at=now()
 WHERE user_id=p_user_id;
 INSERT INTO public.psp_staff_reviews_v498(review_type,subject_id,recommendation,note,actor)
 VALUES('ib',p_user_id,CASE WHEN v_action='approve' THEN 'approved' ELSE 'rejected' END,v_reason,auth.uid());
 RETURN jsonb_build_object('success',true,
  'status',CASE WHEN v_action='approve' THEN 'approved' ELSE 'rejected' END,
  'approved_expires_at',v_until,
  'message',CASE WHEN v_action='approve' THEN 'Approved. Full Access active for 30 days.' ELSE 'Website access revoked.' END);
END;$$;
REVOKE ALL ON FUNCTION public.psp_staff_access_decide_v501(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.psp_staff_access_decide_v501(uuid,text,text) TO authenticated;

-- Old IB endpoint now uses the same website-access approval rules.
CREATE OR REPLACE FUNCTION public.psp_staff_ib_decide_v498(
 p_user_id uuid,p_action text,p_reason text DEFAULT '')
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT public.psp_staff_access_decide_v501(p_user_id,p_action,p_reason);
$$;
REVOKE ALL ON FUNCTION public.psp_staff_ib_decide_v498(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.psp_staff_ib_decide_v498(uuid,text,text) TO authenticated;

INSERT INTO public.mentor_access_settings(key,enabled,description)
VALUES ('indicator_review',true,'EA and indicator queue for explicitly approved reviewers'),
       ('ib_review',true,'Website Access Approvals for explicitly approved reviewers')
ON CONFLICT(key) DO UPDATE SET description=excluded.description;
