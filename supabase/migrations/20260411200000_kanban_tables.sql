-- Kanban columns and cards (Pro cloud). Free tier uses localStorage fallback.

create table if not exists public.kanban_columns (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  title text not null,
  sort_order integer not null default 0,
  primary key (user_id, id)
);

create index if not exists kanban_columns_user_idx
  on public.kanban_columns (user_id, sort_order);

create table if not exists public.kanban_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  column_id text not null,
  title text not null default '',
  notes text not null default '',
  priority text not null default 'medium'
    check (priority in ('high', 'medium', 'low')),
  category text not null default 'Work',
  category_colour text not null default 'bg-blue-500',
  due_date date null,
  goal_id uuid null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists kanban_cards_user_column_idx
  on public.kanban_cards (user_id, column_id, sort_order);

create table if not exists public.kanban_archived_cards (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  column_id text not null default '',
  title text not null default '',
  notes text not null default '',
  priority text not null default 'medium',
  category text not null default 'Work',
  category_colour text not null default 'bg-blue-500',
  due_date date null,
  goal_id uuid null,
  sort_order integer not null default 0,
  created_at timestamptz not null,
  archived_at timestamptz not null default now()
);

alter table public.kanban_columns enable row level security;
alter table public.kanban_cards enable row level security;
alter table public.kanban_archived_cards enable row level security;

create policy "kanban_columns_select_own"
  on public.kanban_columns for select using (auth.uid() = user_id);
create policy "kanban_columns_insert_own"
  on public.kanban_columns for insert with check (auth.uid() = user_id);
create policy "kanban_columns_update_own"
  on public.kanban_columns for update using (auth.uid() = user_id);
create policy "kanban_columns_delete_own"
  on public.kanban_columns for delete using (auth.uid() = user_id);

create policy "kanban_cards_select_own"
  on public.kanban_cards for select using (auth.uid() = user_id);
create policy "kanban_cards_insert_own"
  on public.kanban_cards for insert with check (auth.uid() = user_id);
create policy "kanban_cards_update_own"
  on public.kanban_cards for update using (auth.uid() = user_id);
create policy "kanban_cards_delete_own"
  on public.kanban_cards for delete using (auth.uid() = user_id);

create policy "kanban_archived_select_own"
  on public.kanban_archived_cards for select using (auth.uid() = user_id);
create policy "kanban_archived_insert_own"
  on public.kanban_archived_cards for insert with check (auth.uid() = user_id);
create policy "kanban_archived_delete_own"
  on public.kanban_archived_cards for delete using (auth.uid() = user_id);
