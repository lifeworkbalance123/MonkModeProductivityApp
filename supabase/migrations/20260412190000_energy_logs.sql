-- 2-hourly energy ratings (V2)

CREATE TABLE IF NOT EXISTS public.energy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 10),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_slot TEXT,
  notes TEXT NOT NULL DEFAULT '',
  day_number INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS energy_logs_user_id_idx
  ON public.energy_logs (user_id);

CREATE INDEX IF NOT EXISTS energy_logs_user_logged_at_idx
  ON public.energy_logs (user_id, logged_at DESC);

ALTER TABLE public.energy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own energy logs"
  ON public.energy_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
