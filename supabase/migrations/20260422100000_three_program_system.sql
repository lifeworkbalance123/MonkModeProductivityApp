-- monkcubed three-program types (Sprint, Transform, Mastery) + legacy.
-- Note: enrollment lives in `program_enrollments` (this codebase); spec "user_programs" maps here.

-- ── program_enrollments (was user_programs in spec) ─────────────────────────

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS program_type TEXT DEFAULT 'legacy';

UPDATE public.program_enrollments
SET program_type = 'legacy'
WHERE program_type IS NULL;

ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS program_enrollments_program_type_check;

ALTER TABLE public.program_enrollments
  ADD CONSTRAINT program_enrollments_program_type_check CHECK (
    program_type IN ('legacy', 'sprint', 'transform', 'mastery')
  );

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS rest_period_end TIMESTAMPTZ;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT false;

-- ── daily_actions: Transform evening reflection ─────────────────────────────

ALTER TABLE public.daily_actions
  ADD COLUMN IF NOT EXISTS reflection_text TEXT;

-- ── weekly_reviews: Mastery digital sabbath ─────────────────────────────────

ALTER TABLE public.weekly_reviews
  ADD COLUMN IF NOT EXISTS digital_sabbath_completed BOOLEAN NOT NULL DEFAULT false;

-- ── Mandatory habits catalog (Transform / Mastery) ─────────────────────────

CREATE TABLE IF NOT EXISTS public.program_required_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_type TEXT NOT NULL,
  habit_name TEXT NOT NULL,
  habit_description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT program_required_habits_program_type_check CHECK (
    program_type IN ('transform', 'mastery')
  ),
  CONSTRAINT program_required_habits_program_type_habit_name_key UNIQUE (program_type, habit_name)
);

CREATE INDEX IF NOT EXISTS program_required_habits_program_type_idx
  ON public.program_required_habits (program_type);

INSERT INTO public.program_required_habits (program_type, habit_name, habit_description, display_order)
VALUES
  ('transform', 'Meditation (10 min)', 'Sit silently, focus on breath. Do not skip.', 1),
  ('transform', 'Exercise (30 min)', 'Any movement: walk, gym, yoga. Minimum 30 minutes.', 2),
  ('transform', 'No alcohol/weed', 'Zero exceptions. Log compliance each day.', 3),
  ('mastery', 'Meditation (10 min)', 'Sit silently, focus on breath. Do not skip.', 1),
  ('mastery', 'Exercise (30 min)', 'Any movement: walk, gym, yoga. Minimum 30 minutes.', 2),
  ('mastery', 'No alcohol/weed', 'Zero exceptions. Log compliance each day.', 3)
ON CONFLICT (program_type, habit_name) DO NOTHING;

ALTER TABLE public.program_required_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program_required_habits_select_authenticated"
  ON public.program_required_habits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "program_required_habits_admin_all"
  ON public.program_required_habits
  FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- ── Mastery: cold exposure (one log per user per day) ───────────────────────

CREATE TABLE IF NOT EXISTS public.cold_exposure_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  seconds INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cold_exposure_log_user_id_log_date_key UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS cold_exposure_log_user_id_idx
  ON public.cold_exposure_log (user_id);

CREATE INDEX IF NOT EXISTS cold_exposure_log_log_date_idx
  ON public.cold_exposure_log (log_date);

ALTER TABLE public.cold_exposure_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cold_exposure_log_own_rows"
  ON public.cold_exposure_log
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Mastery: brain training (per type per day) ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.brain_training_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  minutes INT NOT NULL,
  training_type TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT brain_training_log_user_id_log_date_training_type_key UNIQUE (
    user_id,
    log_date,
    training_type
  )
);

CREATE INDEX IF NOT EXISTS brain_training_log_user_id_idx
  ON public.brain_training_log (user_id);

ALTER TABLE public.brain_training_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brain_training_log_own_rows"
  ON public.brain_training_log
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
