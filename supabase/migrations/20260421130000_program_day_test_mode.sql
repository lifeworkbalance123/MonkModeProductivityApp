-- Day-gating test mode: admin can override program day on own user row.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS test_mode_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS test_day_override INT NULL;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS test_mode BOOLEAN NOT NULL DEFAULT false;
