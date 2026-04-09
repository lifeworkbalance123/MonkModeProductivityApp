-- Email lifecycle flags for Resend sequence sends
alter table public.users
  add column if not exists day3_email_sent boolean not null default false;

alter table public.users
  add column if not exists day7_email_sent boolean not null default false;

alter table public.users
  add column if not exists trial_expiry_email_sent boolean not null default false;

alter table public.users
  add column if not exists trial_expired_email_sent boolean not null default false;

-- Email + lifecycle fields used by cron route
alter table public.users
  add column if not exists trial_end_date timestamptz;

alter table public.users
  add column if not exists created_at timestamptz;

alter table public.users
  add column if not exists email text;

alter table public.users
  add column if not exists first_name text;

-- Ensure new users get seeded fields.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    is_pro,
    plan,
    created_at,
    email,
    trial_end_date
  )
  values (
    new.id,
    false,
    'free',
    new.created_at,
    new.email,
    new.created_at + interval '14 days'
  )
  on conflict (id) do update set
    email = excluded.email,
    created_at = excluded.created_at,
    trial_end_date = excluded.trial_end_date;

  return new;
end;
$$;

-- Backfill existing rows (best-effort)
update public.users u
set
  email = coalesce(u.email, au.email),
  created_at = coalesce(u.created_at, au.created_at),
  trial_end_date = coalesce(u.trial_end_date, au.created_at + interval '14 days')
from auth.users au
where au.id = u.id;

