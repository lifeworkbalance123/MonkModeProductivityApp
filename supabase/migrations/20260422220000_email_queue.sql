-- Queued lifecycle emails (Resend) — scheduled by cron, deduped per user per type.

CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (
    email_type IN (
      'welcome_day1',
      'welcome_day3',
      'welcome_day7',
      'at_risk_2days',
      'at_risk_4days',
      'milestone_21',
      'milestone_40',
      'milestone_60',
      're_engagement_7days',
      're_engagement_14days'
    )
  ),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT email_queue_user_type_key UNIQUE (user_id, email_type)
);

CREATE INDEX IF NOT EXISTS email_queue_pending_scheduled_idx
  ON public.email_queue (scheduled_for ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS email_queue_user_id_idx ON public.email_queue (user_id);

COMMENT ON TABLE public.email_queue IS 'Automated email sequence queue; processed by /api/cron/email-sequence.';

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Service role only (cron / server)
REVOKE ALL ON public.email_queue FROM PUBLIC;
GRANT ALL ON public.email_queue TO service_role;
