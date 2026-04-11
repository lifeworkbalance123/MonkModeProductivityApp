-- Personal training library (Layer 2) for Pro cloud sync; Free uses localStorage.

create table if not exists public.user_training_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  resource_url text not null default '',
  notes text not null default '',
  category text not null default 'Other'
    check (category in ('Video', 'Article', 'Podcast', 'Other')),
  created_at timestamptz not null default now()
);

create index if not exists user_training_resources_user_id_idx
  on public.user_training_resources (user_id);

alter table public.user_training_resources enable row level security;

create policy "user_training_resources_select_own"
  on public.user_training_resources for select
  using (auth.uid() = user_id);

create policy "user_training_resources_insert_own"
  on public.user_training_resources for insert
  with check (auth.uid() = user_id);

create policy "user_training_resources_update_own"
  on public.user_training_resources for update
  using (auth.uid() = user_id);

create policy "user_training_resources_delete_own"
  on public.user_training_resources for delete
  using (auth.uid() = user_id);
