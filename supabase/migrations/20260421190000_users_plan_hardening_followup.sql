-- Follow-up hardening for environments where users_plan migration is already applied.
-- Makes plan values strict and adds created_at/updated_at metadata + automatic updated_at refresh.

alter table if exists public.users
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.users
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_plan_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_plan_check
      check (plan in ('free', 'pro'));
  end if;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();
