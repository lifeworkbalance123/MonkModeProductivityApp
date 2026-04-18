-- Optional program stakes: authorize with manual capture → release (cancel) on success, capture on failure

CREATE TABLE IF NOT EXISTS public.financial_stakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  program_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  stripe_payment_intent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  failure_reason TEXT,
  CONSTRAINT financial_stakes_program_type_check CHECK (
    program_type IN (
      '60day',
      'sprint_standard',
      'sprint_monk',
      'transform',
      'mastery'
    )
  ),
  CONSTRAINT financial_stakes_amount_positive CHECK (amount > 0),
  CONSTRAINT financial_stakes_stripe_pi_unique UNIQUE (stripe_payment_intent_id)
);

CREATE INDEX IF NOT EXISTS financial_stakes_user_id_idx ON public.financial_stakes (user_id);
CREATE INDEX IF NOT EXISTS financial_stakes_status_idx ON public.financial_stakes (status);

COMMENT ON TABLE public.financial_stakes IS 'Stripe PI manual capture: pending while authorized; success = hold released; failed = captured as forfeit.';

-- At most one unresolved pending stake per user (authorization in flight or awaiting weekly resolution)
CREATE UNIQUE INDEX IF NOT EXISTS financial_stakes_one_pending_user_idx
  ON public.financial_stakes (user_id)
  WHERE status = 'pending';

ALTER TABLE public.financial_stakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own financial_stakes" ON public.financial_stakes;
CREATE POLICY "Users select own financial_stakes"
  ON public.financial_stakes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.financial_stakes TO authenticated;
