-- CMS: daily lessons, onboarding copy, default starter habits (admin-editable)

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INT NOT NULL UNIQUE,
  phase TEXT NOT NULL DEFAULT 'student',
  title TEXT NOT NULL DEFAULT '',
  lesson TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT '',
  action_label TEXT NOT NULL DEFAULT 'Done ✓',
  category TEXT NOT NULL DEFAULT 'focus',
  tip TEXT DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.onboarding_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_key TEXT NOT NULL UNIQUE,
  heading TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  highlight_text TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.onboarding_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '✅',
  display_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lessons_day_number_idx ON public.lessons (day_number);
CREATE INDEX IF NOT EXISTS onboarding_habits_order_idx ON public.onboarding_habits (display_order ASC, id ASC);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lessons"
  ON public.lessons FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users read published lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (published = true);

CREATE POLICY "Admins manage onboarding_content"
  ON public.onboarding_content FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users read onboarding_content"
  ON public.onboarding_content FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage onboarding_habits"
  ON public.onboarding_habits FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users read onboarding_habits"
  ON public.onboarding_habits FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_content TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_habits TO authenticated;

INSERT INTO public.onboarding_content (step_key, heading, body, cta_label, highlight_text)
VALUES
  (
    'welcome',
    'Welcome to the 60-Day Monk Mode Program',
    'Each day you get one short lesson and one simple action.

That is it. 5 minutes per day. 60 days to become a different person.',
    'Let''s go →',
    ''
  ),
  (
    'why',
    'Before we begin — why are you here?',
    'Most people who start a program like this quit by Day 5.

The ones who finish have one thing in common: they know WHY they started.

You don''t need to tell us. But you need to know it yourself.',
    'I know my why →',
    'Who do I want to be in 60 days? What would change in my life if I had the focus and discipline of a monk?'
  ),
  (
    'commitment',
    'The commitment',
    'This program works if you show up every day — even on the days you don''t feel like it.

Especially those days.

The commitment is simple: one lesson, one action, every day for 60 days.',
    'I commit →',
    'I commit to showing up every day for 60 days. I will complete the daily lesson and action — even on hard days.'
  ),
  (
    'setup',
    'Quick setup',
    'One question to personalise your daily experience.',
    'Looks good →',
    ''
  ),
  (
    'ready',
    'You''re ready.',
    'Day 1 begins now. Your first lesson is waiting.

Remember: the goal is not to be perfect. The goal is to show up every single day.',
    'Begin Day 1 →',
    ''
  )
ON CONFLICT (step_key) DO NOTHING;

INSERT INTO public.onboarding_habits (name, icon, display_order, active)
SELECT v.name, v.icon, v.display_order, v.active
FROM (
  VALUES
    ('Make bed', '🛏️', 1, true),
    ('No phone first hour', '📵', 2, true),
    ('Morning journal', '📓', 3, true),
    ('Cold shower', '🚿', 4, true),
    ('Exercise', '💪', 5, true),
    ('Read 20 minutes', '📚', 6, true)
) AS v(name, icon, display_order, active)
WHERE NOT EXISTS (SELECT 1 FROM public.onboarding_habits LIMIT 1);

INSERT INTO public.lessons (day_number, phase, title, lesson, action, action_label, category, tip)
VALUES
  (
    1,
    'student',
    'Your environment is your destiny',
    'Welcome to Day 1 of your 60-day transformation.

Today is about one thing: your phone.

The average person checks their phone 96 times per day. Every check is a withdrawal from your focus bank.

The most powerful thing you can do today is move your phone out of your bedroom before you sleep tonight.

Monks do not wake up to notifications. Starting tomorrow, neither will you.

Today''s action takes 30 seconds.',
    'Move your phone to another room before bed tonight.',
    'Phone is moved ✓',
    'environment',
    'Well done. Tomorrow you will wake up to silence. Notice how it feels.'
  ),
  (
    2,
    'student',
    'The one thing rule',
    'Yesterday you moved your phone.

Today we talk about focus.

Most productivity systems fail because they ask you to track everything at once.

Monk Mode asks for one thing each day.

Not your top 5. Not your top 3. One.

The question is not what do I need to do today? The question is: if I only did one thing and everything else got harder, what is the one thing that makes everything else easier?

That is your One Big Task.',
    'Set your One Big Task for today in the goal field.',
    'One Big Task set ✓',
    'focus',
    'Do this task before email, before social media, before anything else.'
  )
ON CONFLICT (day_number) DO NOTHING;
