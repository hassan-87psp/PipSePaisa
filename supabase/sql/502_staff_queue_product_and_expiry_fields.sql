-- Reviewer queue fields needed for license issuance / website access expiry.
CREATE OR REPLACE FUNCTION public.psp_staff_queue_v498(p_kind text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF p_kind='indicator' THEN
  IF NOT public.psp_staff_can_v498('indicator') THEN RAISE EXCEPTION 'Indicator review permission required';END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC),'[]'::jsonb) INTO result
  FROM (
   SELECT r.id,r.product_id,r.user_id,r.broker,r.trading_account_id,
    r.status,r.created_at,r.updated_at,r.deposit_amount,r.licensed_version,
    r.license_expires_at,r.licensed_file_name,r.deposit_proof_path,r.payment_proof_path,
    r.user_note,r.admin_note,p.full_name,p.email,
    pr.title AS product_title,pr.platform,pr.access_type,
    pr.version AS product_version,
    pr.requirements->>'min_deposit_usd' AS minimum_deposit,
    av.submission_status AS ib_status,av.available_deposit AS verified_deposit,av.approved_expires_at,
    CASE WHEN av.user_id IS NULL THEN 'missing'
      WHEN av.submission_status<>'approved' THEN coalesce(av.submission_status,'pending')
      WHEN av.approved_expires_at IS NOT NULL AND av.approved_expires_at<=now() THEN 'expired'
      WHEN coalesce(av.available_deposit,0)<coalesce((pr.requirements->>'min_deposit_usd')::numeric,0) THEN 'insufficient'
      ELSE 'verified' END AS verification_state
   FROM public.ea_indicator_requests r
   JOIN public.ea_indicator_products pr ON pr.id=r.product_id
   LEFT JOIN public.profiles p ON p.id=r.user_id
   LEFT JOIN LATERAL(
    SELECT a.user_id,a.submission_status,a.available_deposit,a.approved_expires_at
    FROM public.account_verifications a
    WHERE a.user_id=r.user_id
      AND lower(trim(a.broker))=lower(trim(r.broker))
      AND trim(a.trading_account_id)=trim(r.trading_account_id) LIMIT 1
   ) av ON true
   ORDER BY r.created_at DESC LIMIT 500
  ) x;
 ELSIF p_kind='ib' THEN
  IF NOT public.psp_staff_can_v498('ib') THEN RAISE EXCEPTION 'Website access review permission required'; END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC),'[]'::jsonb) INTO result
  FROM (
   SELECT a.user_id,a.broker,a.trading_account_id,a.available_deposit,
    a.submission_status,a.submitted_at,a.created_at,a.reviewed_at,
    a.approved_expires_at,a.proof_path,a.deposit_proof_path,
    a.rejection_reason,p.full_name,p.email,
    CASE WHEN a.submission_status='approved'
       AND a.approved_expires_at IS NOT NULL AND a.approved_expires_at<=now()
         THEN 'expired' ELSE a.submission_status END AS display_status
   FROM public.account_verifications a
   LEFT JOIN public.profiles p ON p.id=a.user_id
   WHERE a.submission_status<>'not_submitted'
   ORDER BY coalesce(a.submitted_at,a.created_at) DESC LIMIT 500
  ) x;
 ELSE RAISE EXCEPTION 'Unknown staff queue';END IF;
 RETURN coalesce(result,'[]'::jsonb);
END;$$;
REVOKE ALL ON FUNCTION public.psp_staff_queue_v498(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.psp_staff_queue_v498(text) TO authenticated;
