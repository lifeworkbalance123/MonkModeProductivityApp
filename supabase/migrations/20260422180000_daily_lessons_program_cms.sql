-- CMS: daily lessons per program type (text + optional audio/video URLs)

CREATE TABLE IF NOT EXISTS public.daily_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_type TEXT NOT NULL
    CHECK (program_type IN ('sprint_standard', 'sprint_monk', 'transform', 'mastery')),
  program_day INTEGER NOT NULL,
  phase INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  audio_url TEXT,
  video_url TEXT,
  tip_topic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_lessons_program_day_positive CHECK (program_day >= 1),
  CONSTRAINT daily_lessons_phase_positive CHECK (phase >= 1),
  UNIQUE (program_type, program_day)
);

CREATE INDEX IF NOT EXISTS daily_lessons_program_type_day_idx
  ON public.daily_lessons (program_type, program_day ASC);

COMMENT ON TABLE public.daily_lessons IS 'Admin-editable daily tip copy per program track; program_day is 1..max days for that program.';

-- Idempotent: same definition as 20260421190000_users_plan_hardening_followup.sql (needed if that migration was skipped or DB was restored without it).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS daily_lessons_set_updated_at ON public.daily_lessons;
CREATE TRIGGER daily_lessons_set_updated_at
  BEFORE UPDATE ON public.daily_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.daily_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage daily_lessons" ON public.daily_lessons;
CREATE POLICY "Admins manage daily_lessons"
  ON public.daily_lessons
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users read daily_lessons" ON public.daily_lessons;
CREATE POLICY "Users read daily_lessons"
  ON public.daily_lessons
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_lessons TO authenticated;
