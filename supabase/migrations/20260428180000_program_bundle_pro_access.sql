-- Pro access window bundled with Sprint / Monk Mode / Transform: program length + 30 calendar days from enrollment start.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS program_pro_access_until TIMESTAMPTZ;

COMMENT ON COLUMN public.users.program_pro_access_until IS
  'Pro features through this instant when granted via active program bundle (track length + 30d from enrollment start_date). Stripe/trial/lifetime rules still apply in app.';

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS max_program_day INT NULL;

COMMENT ON COLUMN public.program_enrollments.max_program_day IS
  'When set, caps current_day adjustments to this day (admin extension beyond default track length).';
