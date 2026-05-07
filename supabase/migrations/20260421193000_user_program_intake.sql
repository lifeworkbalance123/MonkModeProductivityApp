-- Structured program onboarding answers (per user, one row; upsert from app).

CREATE TABLE IF NOT EXISTS public.user_program_intake (
  user_id uuid PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  selected_program text NOT NULL CHECK (
    selected_program IN ('sprint_standard', 'sprint_monk', 'transform')
  ),
  one_big_task text,
  baseline_wake_time text,
  accountability_preference text CHECK (
    accountability_preference IS NULL
    OR accountability_preference IN ('solo', 'buddy', 'coach')
  ),
  monk_mode_confirmed boolean,
  deadline_date date,
  primary_goal text,
  baseline_bed_time text,
  weekend_same_as_weekday boolean,
  weekend_wake_time text,
  weekend_bed_time text,
  sleep_hours_goal integer CHECK (
    sleep_hours_goal IS NULL OR (sleep_hours_goal >= 4 AND sleep_hours_goal <= 10)
  ),
  biggest_distraction text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_program_intake IS 'Program-specific onboarding questionnaire; RLS: user manages own row.';

DROP TRIGGER IF EXISTS user_program_intake_set_updated_at ON public.user_program_intake;
CREATE TRIGGER user_program_intake_set_updated_at
  BEFORE UPDATE ON public.user_program_intake
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_program_intake ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_program_intake_select_own" ON public.user_program_intake;
CREATE POLICY "user_program_intake_select_own"
  ON public.user_program_intake FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_program_intake_insert_own" ON public.user_program_intake;
CREATE POLICY "user_program_intake_insert_own"
  ON public.user_program_intake FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_program_intake_update_own" ON public.user_program_intake;
CREATE POLICY "user_program_intake_update_own"
  ON public.user_program_intake FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_program_intake TO authenticated;
