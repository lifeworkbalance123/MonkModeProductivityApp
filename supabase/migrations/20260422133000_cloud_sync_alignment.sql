-- Cloud sync schema alignment for Pro users.
-- Idempotent migration: safe to run multiple times.

-- HABITS
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '✅',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.habits
  ALTER COLUMN icon SET DEFAULT '✅';

-- HABIT_COMPLETIONS
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, habit_id, date)
);

ALTER TABLE public.habit_completions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.habit_completions
  ALTER COLUMN completed SET DEFAULT false;

-- GOALS
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority INT DEFAULT 3,
  completed BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'daily',
  date DATE DEFAULT CURRENT_DATE,
  is_one_big_task BOOLEAN DEFAULT false,
  day_number INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS is_one_big_task BOOLEAN DEFAULT false;
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS day_number INT;
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.goals
  ALTER COLUMN priority SET DEFAULT 3;
ALTER TABLE public.goals
  ALTER COLUMN completed SET DEFAULT false;
ALTER TABLE public.goals
  ALTER COLUMN type SET DEFAULT 'daily';
ALTER TABLE public.goals
  ALTER COLUMN date SET DEFAULT CURRENT_DATE;

-- JOURNAL_ENTRIES
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'morning',
  entry_1 TEXT DEFAULT '',
  entry_2 TEXT DEFAULT '',
  entry_3 TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, type)
);

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.journal_entries
  ALTER COLUMN type SET DEFAULT 'morning';
ALTER TABLE public.journal_entries
  ALTER COLUMN entry_1 SET DEFAULT '';
ALTER TABLE public.journal_entries
  ALTER COLUMN entry_2 SET DEFAULT '';
ALTER TABLE public.journal_entries
  ALTER COLUMN entry_3 SET DEFAULT '';

-- PLANNER_SLOTS
CREATE TABLE IF NOT EXISTS public.planner_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  activity TEXT NOT NULL,
  category TEXT DEFAULT 'Personal',
  colour TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, time_slot)
);

ALTER TABLE public.planner_slots
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.planner_slots
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.planner_slots
  ALTER COLUMN category SET DEFAULT 'Personal';
ALTER TABLE public.planner_slots
  ALTER COLUMN colour SET DEFAULT '#3B82F6';

-- STREAKS
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.streaks
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.streaks
  ALTER COLUMN current_streak SET DEFAULT 0;
ALTER TABLE public.streaks
  ALTER COLUMN best_streak SET DEFAULT 0;

-- Enable RLS on all sync tables
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Normalize policy names to one policy per table.
DROP POLICY IF EXISTS habits_select_own ON public.habits;
DROP POLICY IF EXISTS habits_insert_own ON public.habits;
DROP POLICY IF EXISTS habits_update_own ON public.habits;
DROP POLICY IF EXISTS habits_delete_own ON public.habits;
DROP POLICY IF EXISTS habit_completions_select_own ON public.habit_completions;
DROP POLICY IF EXISTS habit_completions_insert_own ON public.habit_completions;
DROP POLICY IF EXISTS habit_completions_update_own ON public.habit_completions;
DROP POLICY IF EXISTS habit_completions_delete_own ON public.habit_completions;
DROP POLICY IF EXISTS goals_select_own ON public.goals;
DROP POLICY IF EXISTS goals_insert_own ON public.goals;
DROP POLICY IF EXISTS goals_update_own ON public.goals;
DROP POLICY IF EXISTS goals_delete_own ON public.goals;
DROP POLICY IF EXISTS journal_entries_select_own ON public.journal_entries;
DROP POLICY IF EXISTS journal_entries_insert_own ON public.journal_entries;
DROP POLICY IF EXISTS journal_entries_update_own ON public.journal_entries;
DROP POLICY IF EXISTS journal_entries_delete_own ON public.journal_entries;
DROP POLICY IF EXISTS planner_slots_select_own ON public.planner_slots;
DROP POLICY IF EXISTS planner_slots_insert_own ON public.planner_slots;
DROP POLICY IF EXISTS planner_slots_update_own ON public.planner_slots;
DROP POLICY IF EXISTS planner_slots_delete_own ON public.planner_slots;
DROP POLICY IF EXISTS streaks_select_own ON public.streaks;
DROP POLICY IF EXISTS streaks_insert_own ON public.streaks;
DROP POLICY IF EXISTS streaks_update_own ON public.streaks;
DROP POLICY IF EXISTS streaks_delete_own ON public.streaks;

DROP POLICY IF EXISTS habits_rls ON public.habits;
CREATE POLICY habits_rls
  ON public.habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS habit_completions_rls ON public.habit_completions;
CREATE POLICY habit_completions_rls
  ON public.habit_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS goals_rls ON public.goals;
CREATE POLICY goals_rls
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS journal_rls ON public.journal_entries;
CREATE POLICY journal_rls
  ON public.journal_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS planner_rls ON public.planner_slots;
CREATE POLICY planner_rls
  ON public.planner_slots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS streaks_rls ON public.streaks;
CREATE POLICY streaks_rls
  ON public.streaks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

