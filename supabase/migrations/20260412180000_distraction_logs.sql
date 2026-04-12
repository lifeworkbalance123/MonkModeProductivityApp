-- Quick distraction urge logging (V2)

CREATE TABLE IF NOT EXISTS public.distraction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger_text TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  day_number INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS distraction_logs_user_id_idx
  ON public.distraction_logs (user_id);

CREATE INDEX IF NOT EXISTS distraction_logs_user_logged_at_idx
  ON public.distraction_logs (user_id, logged_at DESC);

ALTER TABLE public.distraction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own distractions"
  ON public.distraction_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
