-- Weekly schedule template (per user) + named unique constraints for dashboard day sync.

CREATE TABLE IF NOT EXISTS public.schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE UNIQUE,
  start_time TEXT NOT NULL DEFAULT '05:00',
  increment_minutes INT NOT NULL DEFAULT 60
    CHECK (increment_minutes IN (15, 30, 60)),
  block_count INT NOT NULL DEFAULT 8
    CHECK (block_count BETWEEN 1 AND 20),
  blocks JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS schedule_templates_user_id_idx
  ON public.schedule_templates (user_id);

ALTER TABLE public.schedule_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS schedule_templates_user_policy ON public.schedule_templates;
CREATE POLICY schedule_templates_user_policy
  ON public.schedule_templates
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_templates TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'planner_slots_user_date_time_key'
  ) THEN
    ALTER TABLE public.planner_slots
      ADD CONSTRAINT planner_slots_user_date_time_key
      UNIQUE (user_id, date, time_slot);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'journal_entries_user_date_type_key'
  ) THEN
    ALTER TABLE public.journal_entries
      ADD CONSTRAINT journal_entries_user_date_type_key
      UNIQUE (user_id, date, type);
  END IF;
END $$;
