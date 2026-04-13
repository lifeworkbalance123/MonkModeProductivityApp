-- Editable V2 program onboarding wizard (content + order). UI templates keyed by step_kind.

CREATE TABLE IF NOT EXISTS public.onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_order INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  action_label TEXT NOT NULL DEFAULT 'Next',
  step_kind TEXT NOT NULL DEFAULT 'content'
    CHECK (step_kind IN ('welcome', 'why', 'commitment', 'wake', 'ready', 'content')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS onboarding_steps_order_idx
  ON public.onboarding_steps (step_order ASC, id ASC);

ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_steps_select_public"
  ON public.onboarding_steps
  FOR SELECT
  USING (true);

CREATE POLICY "onboarding_steps_insert_admin"
  ON public.onboarding_steps
  FOR INSERT
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "onboarding_steps_update_admin"
  ON public.onboarding_steps
  FOR UPDATE
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "onboarding_steps_delete_admin"
  ON public.onboarding_steps
  FOR DELETE
  USING (public.is_current_user_admin());

GRANT SELECT ON public.onboarding_steps TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.onboarding_steps TO authenticated;

-- Seed default 60-day flow once (edit in Admin → Onboarding)
INSERT INTO public.onboarding_steps (step_order, title, description, video_url, action_label, step_kind)
SELECT *
FROM (
  VALUES
    (
      0,
      'Welcome to the 60-Day Monk Mode Program',
      $w$
Over the next 60 days you will build the habits, focus, and discipline of a monk.

Each day takes 5–10 minutes. The results last a lifetime.
$w$::text,
      NULL::text,
      E'Let''s go →'::text,
      'welcome'::text
    ),
    (
      1,
      'Before we start — why are you here?',
      $y$
Most people who start a program like this quit by Day 5. The ones who finish have one thing in common: they know WHY they started. You don't need to tell us. But you need to know it.

---CARD---
Ask yourself:
"Who do I want to be in 60 days? What would change in my life if I had the focus and discipline of a monk?"
$y$::text,
      NULL::text,
      'I know my why →'::text,
      'why'::text
    ),
    (
      2,
      'The commitment',
      $c$
This program works if you show up every day — even on the days you don't feel like it. Especially those days.

The commitment is simple: one lesson, one action, every day for 60 days.

---CHECK---
I commit to showing up every day for 60 days. I will complete the daily lesson and action — even on hard days.
$c$::text,
      NULL::text,
      'I commit →'::text,
      'commitment'::text
    ),
    (
      3,
      'Quick setup',
      $k$
One question to personalise your program.

---WAKE---
What time do you wake up?

---HABITS---
We'll pre-load these starter habits for you:
🛏️ Make bed
📵 No phone first hour
📓 Morning journal
🚿 Cold shower
💪 Exercise
📚 Read 20 minutes

You can edit these anytime in the Habits section.
$k$::text,
      NULL::text,
      'Looks good →'::text,
      'wake'::text
    ),
    (
      4,
      'You''re ready.',
      $r$
Day 1 begins now. Your first lesson is waiting.

Remember: the goal is not to be perfect. The goal is to show up every single day.
$r$::text,
      NULL::text,
      'Begin Day 1 →'::text,
      'ready'::text
    )
) AS v(step_order, title, description, video_url, action_label, step_kind)
WHERE NOT EXISTS (SELECT 1 FROM public.onboarding_steps LIMIT 1);
