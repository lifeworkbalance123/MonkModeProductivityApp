-- Optional bonus row per program day (mirrors lessons.is_bonus pattern)

ALTER TABLE public.daily_lessons DROP CONSTRAINT IF EXISTS daily_lessons_program_type_program_day_key;

ALTER TABLE public.daily_lessons
  ADD COLUMN IF NOT EXISTS is_bonus BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_day_number INT;

CREATE UNIQUE INDEX IF NOT EXISTS daily_lessons_program_type_program_day_is_bonus_key
  ON public.daily_lessons (program_type, program_day, is_bonus);

COMMENT ON COLUMN public.daily_lessons.is_bonus IS 'Primary tip: false. Optional extra content for the same calendar day: true.';
COMMENT ON COLUMN public.daily_lessons.parent_day_number IS 'For bonus rows, usually equals program_day.';
