-- Run in Supabase SQL editor or via CLI. Links app plan to auth.users.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  is_pro boolean not null default false,
  plan text not null default 'free'
);

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id);

create policy "users_insert_own"
  on public.users for insert
  with check (auth.uid() = id);

-- Seed a row for each new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, is_pro, plan)
  values (new.id, false, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
