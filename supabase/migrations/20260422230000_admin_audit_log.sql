-- Admin support actions (adjust day, refunds, etc.)

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx
  ON public.admin_audit_log (target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_log_admin_idx
  ON public.admin_audit_log (admin_user_id, created_at DESC);

COMMENT ON TABLE public.admin_audit_log IS 'Support/admin actions; written from API routes using service role.';

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- No authenticated access; service role bypasses RLS for inserts from API.

REVOKE ALL ON public.admin_audit_log FROM PUBLIC;
GRANT ALL ON public.admin_audit_log TO service_role;
