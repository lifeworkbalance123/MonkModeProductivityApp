-- MonkMode app data sync (Pro cloud). RLS: users only access own rows.

-- Habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists habits_user_id_idx on public.habits (user_id);

-- Habit completions (one row per habit per calendar day when completed)
create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  date date not null,
  completed boolean not null default true,
  unique (user_id, habit_id, date)
);

create index if not exists habit_completions_user_id_idx on public.habit_completions (user_id);

-- Goals
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  priority int not null default 0,
  completed boolean not null default false,
  type text not null default 'daily' check (type in ('daily', 'weekly', 'monthly')),
  date date not null default (current_date)
);

create index if not exists goals_user_id_idx on public.goals (user_id);

-- Weekly/day template schedule slots (app uses a fixed anchor date for the template)
create table if not exists public.planner_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  time_slot text not null,
  activity text not null,
  category text not null,
  colour text not null,
  unique (user_id, date, time_slot)
);

create index if not exists planner_slots_user_date_idx on public.planner_slots (user_id, date);

-- Journal (morning gratitude / evening achievements — anchored date in app layer)
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  type text not null check (type in ('morning', 'evening')),
  entry_1 text not null default '',
  entry_2 text not null default '',
  entry_3 text not null default '',
  unique (user_id, date, type)
);

create index if not exists journal_entries_user_id_idx on public.journal_entries (user_id);

-- Streak summary (optional cache; app also derives from completions)
create table if not exists public.streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak int not null default 0,
  best_streak int not null default 0,
  last_completed_date date
);

-- Row Level Security
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.goals enable row level security;
alter table public.planner_slots enable row level security;
alter table public.journal_entries enable row level security;
alter table public.streaks enable row level security;

-- habits
create policy habits_select_own on public.habits for select using (auth.uid() = user_id);
create policy habits_insert_own on public.habits for insert with check (auth.uid() = user_id);
create policy habits_update_own on public.habits for update using (auth.uid() = user_id);
create policy habits_delete_own on public.habits for delete using (auth.uid() = user_id);

-- habit_completions
create policy habit_completions_select_own on public.habit_completions for select using (auth.uid() = user_id);
create policy habit_completions_insert_own on public.habit_completions for insert with check (auth.uid() = user_id);
create policy habit_completions_update_own on public.habit_completions for update using (auth.uid() = user_id);
create policy habit_completions_delete_own on public.habit_completions for delete using (auth.uid() = user_id);

-- goals
create policy goals_select_own on public.goals for select using (auth.uid() = user_id);
create policy goals_insert_own on public.goals for insert with check (auth.uid() = user_id);
create policy goals_update_own on public.goals for update using (auth.uid() = user_id);
create policy goals_delete_own on public.goals for delete using (auth.uid() = user_id);

-- planner_slots
create policy planner_slots_select_own on public.planner_slots for select using (auth.uid() = user_id);
create policy planner_slots_insert_own on public.planner_slots for insert with check (auth.uid() = user_id);
create policy planner_slots_update_own on public.planner_slots for update using (auth.uid() = user_id);
create policy planner_slots_delete_own on public.planner_slots for delete using (auth.uid() = user_id);

-- journal_entries
create policy journal_entries_select_own on public.journal_entries for select using (auth.uid() = user_id);
create policy journal_entries_insert_own on public.journal_entries for insert with check (auth.uid() = user_id);
create policy journal_entries_update_own on public.journal_entries for update using (auth.uid() = user_id);
create policy journal_entries_delete_own on public.journal_entries for delete using (auth.uid() = user_id);

-- streaks
create policy streaks_select_own on public.streaks for select using (auth.uid() = user_id);
create policy streaks_insert_own on public.streaks for insert with check (auth.uid() = user_id);
create policy streaks_update_own on public.streaks for update using (auth.uid() = user_id);
create policy streaks_delete_own on public.streaks for delete using (auth.uid() = user_id);
