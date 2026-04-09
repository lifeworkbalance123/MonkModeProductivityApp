create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now(),
  source text,
  notified boolean not null default false
);

alter table public.waitlist enable row level security;

drop policy if exists "waitlist_insert_anon" on public.waitlist;
create policy "waitlist_insert_anon"
on public.waitlist
for insert
to anon, authenticated
with check (true);

drop policy if exists "waitlist_select_admin" on public.waitlist;
create policy "waitlist_select_admin"
on public.waitlist
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.is_admin = true
  )
);

