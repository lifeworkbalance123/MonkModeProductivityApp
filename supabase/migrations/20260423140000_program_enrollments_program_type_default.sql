-- Fix INSERT failures when program_type is omitted: an older migration set DEFAULT '60day',
-- while the current CHECK (see 20260422100000_three_program_system.sql) only allows
-- 'legacy', 'sprint', 'transform', 'mastery'. ADD COLUMN IF NOT EXISTS did not refresh the default.

ALTER TABLE public.program_enrollments
  ALTER COLUMN program_type SET DEFAULT 'legacy';
