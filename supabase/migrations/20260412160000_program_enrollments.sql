-- 60-day program enrollment + day tracking (V2 foundation)

CREATE TABLE IF NOT EXISTS public.program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  current_day INT NOT NULL DEFAULT 1,
  phase TEXT NOT NULL DEFAULT 'student',
  status TEXT NOT NULL DEFAULT 'active',
  completed_days INT[] NOT NULL DEFAULT '{}',
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT program_enrollments_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS program_enrollments_user_id_idx
  ON public.program_enrollments (user_id);

ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own enrollment"
  ON public.program_enrollments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
