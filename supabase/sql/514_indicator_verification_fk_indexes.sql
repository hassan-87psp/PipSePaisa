-- Cover the two foreign keys reported by the database performance advisor.
-- No user rows or permissions are modified.
CREATE INDEX IF NOT EXISTS psp_indicator_v517_request_fk_idx
  ON public.psp_indicator_verification_switch_audit_v517 (request_id);
CREATE INDEX IF NOT EXISTS psp_indicator_v517_user_fk_idx
  ON public.psp_indicator_verification_switch_audit_v517 (user_id);
