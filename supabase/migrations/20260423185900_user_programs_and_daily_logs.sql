-- Program row per user (`user_programs`) + optional day-zero `daily_logs` row.
-- Complements `program_enrollments`; use POST /api/program/start when persisting here.

CREATE TABLE IF NOT EXISTS public.user_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  program_type text NOT NULL,
  program_day integer NOT NULL DEFAULT 1,
  phase integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  one_big_task text,
  baseline_wake_time time,
  baseline_bed_time time,
  deadline_date date,
  primary_goal text,
  biggest_distraction text,
  accountability_preference text,
  monk_mode_confirmed boolean NOT NULL DEFAULT false,
  weekend_wake_time time,
  weekend_bed_time time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_programs_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS user_programs_user_id_idx ON public.user_programs (user_id);

DROP TRIGGER IF EXISTS user_programs_set_updated_at ON public.user_programs;
CREATE TRIGGER user_programs_set_updated_at
  BEFORE UPDATE ON public.user_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_programs_own_all" ON public.user_programs;
CREATE POLICY "user_programs_own_all"
  ON public.user_programs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_programs TO authenticated;

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  log_date date NOT NULL,
  program_type text NOT NULL,
  program_day integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_logs_user_id_log_date_key UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS daily_logs_user_id_idx ON public.daily_logs (user_id);
CREATE INDEX IF NOT EXISTS daily_logs_log_date_idx ON public.daily_logs (log_date);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_logs_own_all" ON public.daily_logs;
CREATE POLICY "daily_logs_own_all"
  ON public.daily_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_logs TO authenticated;
