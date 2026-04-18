-- Optional paid weekly 15-min coaching; Calendly holds schedule, Stripe holds payment

CREATE TABLE IF NOT EXISTS public.coach_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  program_type TEXT,
  calendly_event_uuid TEXT,
  calendly_invitee_uri TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  billing_type TEXT CHECK (billing_type IN ('one_time', 'subscription')),
  stripe_checkout_session_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coach_sessions_program_type_check CHECK (
    program_type IS NULL
    OR program_type IN (
      '60day',
      'sprint_standard',
      'sprint_monk',
      'transform',
      'mastery'
    )
  ),
  CONSTRAINT coach_sessions_calendly_event_uuid_key UNIQUE (calendly_event_uuid)
);

CREATE INDEX IF NOT EXISTS coach_sessions_user_id_idx ON public.coach_sessions (user_id);
CREATE INDEX IF NOT EXISTS coach_sessions_scheduled_at_idx ON public.coach_sessions (scheduled_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS coach_sessions_status_idx ON public.coach_sessions (status);

COMMENT ON TABLE public.coach_sessions IS 'Weekly coaching calls; created/updated from Calendly webhooks; payment via Stripe checkout metadata.';

ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own coach_sessions" ON public.coach_sessions;
CREATE POLICY "Users select own coach_sessions"
  ON public.coach_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage coach_sessions" ON public.coach_sessions;
CREATE POLICY "Admins manage coach_sessions"
  ON public.coach_sessions
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.coach_sessions TO authenticated;
