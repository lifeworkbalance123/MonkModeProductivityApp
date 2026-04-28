-- Buddy sharing: witness link + referral link (per active user_programs row)

ALTER TABLE public.user_programs
  ADD COLUMN IF NOT EXISTS witness_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS witness_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS witness_views INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_slug TEXT UNIQUE;

-- Optional referral click tracking (written by server/service role).
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  user_program_id UUID REFERENCES public.user_programs (id) ON DELETE SET NULL,
  program_type TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_programs_witness_slug
  ON public.user_programs (witness_slug);

CREATE INDEX IF NOT EXISTS idx_user_programs_referral_slug
  ON public.user_programs (referral_slug);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_referrer_user_id
  ON public.referral_clicks (referrer_user_id);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_clicked_at
  ON public.referral_clicks (clicked_at);

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_clicks_admin_all" ON public.referral_clicks;
CREATE POLICY "referral_clicks_admin_all"
  ON public.referral_clicks
  FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

