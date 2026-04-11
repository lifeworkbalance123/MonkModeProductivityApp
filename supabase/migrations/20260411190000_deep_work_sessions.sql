-- Deep Work session log (Pro cloud sync). Free tier uses localStorage.

create table if not exists public.deep_work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date not null,
  task_name text not null default '',
  duration_minutes integer not null default 0,
  completed boolean not null default false,
  result text null
    check (result is null or result in ('crushed', 'progress', 'distracted')),
  sprint_number integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists deep_work_sessions_user_date_idx
  on public.deep_work_sessions (user_id, session_date desc);

alter table public.deep_work_sessions enable row level security;

create policy "deep_work_sessions_select_own"
  on public.deep_work_sessions for select
  using (auth.uid() = user_id);

create policy "deep_work_sessions_insert_own"
  on public.deep_work_sessions for insert
  with check (auth.uid() = user_id);

create policy "deep_work_sessions_delete_own"
  on public.deep_work_sessions for delete
  using (auth.uid() = user_id);
