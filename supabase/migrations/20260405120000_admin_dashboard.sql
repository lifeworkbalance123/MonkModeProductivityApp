-- Admin flag, profile fields for admin UI, RLS for admins, announcements.
-- After running: set is_admin = true for your user in Table Editor → public.users
-- Optional backfill: UPDATE public.users u SET email = au.email, created_at = COALESCE(u.created_at, au.created_at)
--   FROM auth.users au WHERE u.id = au.id;

alter table public.users
  add column if not exists is_admin boolean not null default false;

alter table public.users
  add column if not exists email text;

alter table public.users
  add column if not exists created_at timestamptz not null default now();

alter table public.users
  add column if not exists last_active_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, is_pro, plan, email, created_at, is_admin, last_active_at)
  values (new.id, false, 'free', new.email, now(), false, null)
  on conflict (id) do update set
    email = coalesce(excluded.email, public.users.email);
  return new;
end;
$$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select u.is_admin from public.users u where u.id = auth.uid() limit 1),
    false
  );
$$;

grant execute on function public.is_current_user_admin() to authenticated;

create policy "users_select_if_admin"
  on public.users for select
  using (public.is_current_user_admin());

create policy "users_update_if_admin"
  on public.users for update
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

create table if not exists public.announcements (
  id integer primary key default 1,
  body text not null default '',
  updated_at timestamptz not null default now(),
  constraint announcements_single_row check (id = 1)
);

alter table public.announcements enable row level security;

insert into public.announcements (id, body)
values (1, '')
on conflict (id) do nothing;

create policy "announcements_select_authenticated"
  on public.announcements for select
  to authenticated
  using (true);

create policy "announcements_all_admin"
  on public.announcements for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());
