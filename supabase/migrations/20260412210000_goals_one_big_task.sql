-- One Big Task: single daily priority row separate from Top 5 goals

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS is_one_big_task BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS day_number INT;
