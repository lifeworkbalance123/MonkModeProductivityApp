-- Extend existing monkcubed program tables (non-breaking additive migration)

-- program_enrollments extensions
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS restart_date TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS baseline_wake_time TIME DEFAULT NULL;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS baseline_bed_time TIME DEFAULT NULL;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS preferred_deep_work_time TEXT DEFAULT NULL;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS sleep_hours_goal NUMERIC DEFAULT 7.5;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS program_type TEXT DEFAULT '60day';

ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS program_enrollments_program_type_check;

UPDATE public.program_enrollments
SET program_type = CASE program_type
  WHEN 'legacy' THEN '60day'
  WHEN 'sprint' THEN 'sprint_standard'
  ELSE program_type
END
WHERE program_type IN ('legacy', 'sprint') OR program_type IS NULL;

ALTER TABLE public.program_enrollments
  ADD CONSTRAINT program_enrollments_program_type_check
  CHECK (program_type IN (
    '60day',
    'sprint_standard',
    'sprint_monk',
    'transform',
    'mastery'
  ));

-- daily_actions extensions
ALTER TABLE public.daily_actions
  ADD COLUMN IF NOT EXISTS program_type TEXT DEFAULT '60day';

ALTER TABLE public.daily_actions
  ADD COLUMN IF NOT EXISTS lemon_water_done BOOLEAN DEFAULT false;

ALTER TABLE public.daily_actions
  ADD COLUMN IF NOT EXISTS micro_journal_text TEXT DEFAULT '';

ALTER TABLE public.daily_actions
  ADD COLUMN IF NOT EXISTS micro_journal_completed BOOLEAN DEFAULT false;

ALTER TABLE public.daily_actions
  ADD COLUMN IF NOT EXISTS wake_time_logged TIME DEFAULT NULL;

ALTER TABLE public.daily_actions
  ADD COLUMN IF NOT EXISTS evening_checkin_completed BOOLEAN DEFAULT false;

ALTER TABLE public.daily_actions
  ADD COLUMN IF NOT EXISTS weekly_anchor_done BOOLEAN DEFAULT false;

ALTER TABLE public.daily_actions
  ADD COLUMN IF NOT EXISTS phone_out_bedroom BOOLEAN DEFAULT false;

ALTER TABLE public.daily_actions
  ADD COLUMN IF NOT EXISTS energy_rating INT DEFAULT NULL;

ALTER TABLE public.daily_actions
  ADD COLUMN IF NOT EXISTS free_journal TEXT DEFAULT '';

ALTER TABLE public.daily_actions
  DROP CONSTRAINT IF EXISTS daily_actions_energy_rating_check;

ALTER TABLE public.daily_actions
  ADD CONSTRAINT daily_actions_energy_rating_check
  CHECK (energy_rating IS NULL OR energy_rating BETWEEN 1 AND 5);

-- weekly_reviews extensions
ALTER TABLE public.weekly_reviews
  ADD COLUMN IF NOT EXISTS program_type TEXT DEFAULT '60day';

ALTER TABLE public.weekly_reviews
  ADD COLUMN IF NOT EXISTS biggest_distraction TEXT DEFAULT '';

ALTER TABLE public.weekly_reviews
  ADD COLUMN IF NOT EXISTS energy_rating_weekly INT DEFAULT NULL;

ALTER TABLE public.weekly_reviews
  DROP CONSTRAINT IF EXISTS weekly_reviews_energy_rating_weekly_check;

ALTER TABLE public.weekly_reviews
  ADD CONSTRAINT weekly_reviews_energy_rating_weekly_check
  CHECK (energy_rating_weekly IS NULL OR energy_rating_weekly BETWEEN 1 AND 10);

-- wake_targets table
CREATE TABLE IF NOT EXISTS public.wake_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_day INT NOT NULL,
  target_wake_time TIME NOT NULL,
  program_type TEXT DEFAULT '60day',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_day, program_type)
);

ALTER TABLE public.wake_targets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wake_targets'
      AND policyname = 'wake_targets_user_policy'
  ) THEN
    CREATE POLICY wake_targets_user_policy
      ON public.wake_targets FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- streak forgiveness fields
ALTER TABLE public.streaks
  ADD COLUMN IF NOT EXISTS weekly_streak INT DEFAULT 0;

ALTER TABLE public.streaks
  ADD COLUMN IF NOT EXISTS current_week_days_completed INT DEFAULT 0;

ALTER TABLE public.streaks
  ADD COLUMN IF NOT EXISTS program_type TEXT DEFAULT '60day';

-- 5-of-7 weekly streak function
CREATE OR REPLACE FUNCTION public.get_weekly_streak(
  p_user_id UUID,
  p_program_type TEXT DEFAULT '60day'
)
RETURNS TABLE (
  weekly_streak INT,
  current_week_completed INT,
  current_week_target INT
) AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_streak INT := 0;
  v_current_week_days INT := 0;
  v_days_completed INT;
BEGIN
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  v_week_end := v_week_start + 6;

  SELECT COUNT(*)::INT INTO v_current_week_days
  FROM public.daily_actions
  WHERE user_id = p_user_id
    AND program_type = p_program_type
    AND (
      COALESCE(completed_at::date, CURRENT_DATE) BETWEEN v_week_start AND v_week_end
      OR (
        day_number >= 1
        AND day_number IS NOT NULL
        AND (CURRENT_DATE - (day_number - 1)) BETWEEN v_week_start AND v_week_end
      )
    )
    AND (
      evening_checkin_completed = true
      OR completed = true
    );

  FOR i IN 0..11 LOOP
    v_week_start := date_trunc('week', CURRENT_DATE - (i * 7))::DATE;
    v_week_end := v_week_start + 6;

    SELECT COUNT(*)::INT INTO v_days_completed
    FROM public.daily_actions
    WHERE user_id = p_user_id
      AND program_type = p_program_type
      AND (
        COALESCE(completed_at::date, CURRENT_DATE) BETWEEN v_week_start AND v_week_end
        OR (
          day_number >= 1
          AND day_number IS NOT NULL
          AND (CURRENT_DATE - (day_number - 1)) BETWEEN v_week_start AND v_week_end
        )
      )
      AND (
        evening_checkin_completed = true
        OR completed = true
      );

    EXIT WHEN v_days_completed < 5;
    v_streak := v_streak + 1;
  END LOOP;

  RETURN QUERY SELECT v_streak, v_current_week_days, 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
