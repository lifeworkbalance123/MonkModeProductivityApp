-- Tracks one row per user per program milestone day (celebration / badge / analytics).
-- Milestone schedule is enforced in app; this table stores what was recorded.

CREATE TABLE IF NOT EXISTS public.user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  program_type TEXT NOT NULL,
  milestone_day INTEGER NOT NULL,
  milestone_name TEXT,
  celebrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_milestones_program_type_check CHECK (
    program_type IN (
      '60day',
      'sprint_standard',
      'sprint_monk',
      'transform',
      'mastery'
    )
  ),
  CONSTRAINT user_milestones_day_positive CHECK (milestone_day >= 1),
  UNIQUE (user_id, program_type, milestone_day)
);

CREATE INDEX IF NOT EXISTS user_milestones_user_id_idx
  ON public.user_milestones (user_id);

CREATE INDEX IF NOT EXISTS user_milestones_user_program_idx
  ON public.user_milestones (user_id, program_type);

ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_milestones_select_own" ON public.user_milestones;
CREATE POLICY "user_milestones_select_own"
  ON public.user_milestones
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_milestones_insert_own" ON public.user_milestones;
CREATE POLICY "user_milestones_insert_own"
  ON public.user_milestones
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_milestones_delete_own" ON public.user_milestones;
CREATE POLICY "user_milestones_delete_own"
  ON public.user_milestones
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage user_milestones" ON public.user_milestones;
CREATE POLICY "Admins manage user_milestones"
  ON public.user_milestones
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT, INSERT, DELETE ON public.user_milestones TO authenticated;
