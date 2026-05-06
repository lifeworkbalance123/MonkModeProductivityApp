-- Program checkout trial: optional time-bound access before payment.
-- Existing rows are marked paid so behavior is unchanged (no trial migration).

ALTER TABLE public.user_programs
  ADD COLUMN IF NOT EXISTS trial_end timestamptz;

ALTER TABLE public.user_programs
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.user_programs
  DROP CONSTRAINT IF EXISTS user_programs_payment_status_check;

ALTER TABLE public.user_programs
  ADD CONSTRAINT user_programs_payment_status_check
  CHECK (payment_status IN ('pending', 'trial', 'paid', 'expired'));

COMMENT ON COLUMN public.user_programs.trial_end IS
  'When set with payment_status=trial, program features allowed until this instant (UTC).';

COMMENT ON COLUMN public.user_programs.payment_status IS
  'pending: legacy/unset; trial: time-limited free program; paid: purchased or admin full access; expired: trial ended without pay.';

-- Grandfather existing enrollments as paid (no trial, full access).
UPDATE public.user_programs
SET payment_status = 'paid'
WHERE trial_end IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_programs_trial_end ON public.user_programs (trial_end);
