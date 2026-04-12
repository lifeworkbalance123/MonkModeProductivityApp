-- Banner: only expose announcement row to non-admins when active = true.
-- Admins can still read/write via is_current_user_admin() (existing policies).

alter table public.announcements
  add column if not exists active boolean not null default false;

drop policy if exists "announcements_select_authenticated" on public.announcements;

create policy "announcements_select_visible"
  on public.announcements
  for select
  to authenticated
  using (active = true or public.is_current_user_admin());

-- Optional helper (RLS expressions may use is_current_user_admin() instead).
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.id = user_id
      and u.is_admin is true
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;

-- One-time bootstrap (run manually if needed; do not commit real emails):
-- update public.users set is_admin = true where email = 'your-owner@example.com';
