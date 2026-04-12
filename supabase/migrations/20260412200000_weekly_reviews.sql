-- Structured weekly review (8 checkpoints in 60-day program)

CREATE TABLE IF NOT EXISTS public.weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  day_number INT NOT NULL,
  what_worked TEXT NOT NULL DEFAULT '',
  what_didnt TEXT NOT NULL DEFAULT '',
  one_change TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT weekly_reviews_user_id_week_number_key UNIQUE (user_id, week_number)
);

CREATE INDEX IF NOT EXISTS weekly_reviews_user_id_idx
  ON public.weekly_reviews (user_id);

ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reviews"
  ON public.weekly_reviews
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
