-- Per-day lesson completion rows (V2 daily action tap)

CREATE TABLE IF NOT EXISTS public.daily_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_actions_user_id_day_number_key UNIQUE (user_id, day_number)
);

CREATE INDEX IF NOT EXISTS daily_actions_user_id_idx
  ON public.daily_actions (user_id);

ALTER TABLE public.daily_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own actions"
  ON public.daily_actions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
