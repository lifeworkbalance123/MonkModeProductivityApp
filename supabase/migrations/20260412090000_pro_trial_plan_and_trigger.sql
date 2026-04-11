-- Pro trial: allow plan values used by Stripe + trial, seed new users as active trial.

alter table public.users
  add column if not exists trial_start_date timestamptz;

alter table public.users
  add column if not exists is_trial_active boolean not null default true;

alter table public.users
  add column if not exists trial_converted boolean not null default false;

alter table public.users
  add column if not exists trial_expired_modal_shown boolean not null default false;

alter table public.users
  add column if not exists is_admin boolean not null default false;

-- Widen plan enum to match app + Stripe (annual was missing from original check).
alter table public.users drop constraint if exists users_plan_check;

alter table public.users
  add constraint users_plan_check
  check (
    plan in (
      'free',
      'trial',
      'monthly',
      'annual',
      'lifetime'
    )
  );

-- New signups: trial plan + explicit window (server + API use these for isPro).
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
    trial_start_date,
    trial_end_date,
    is_trial_active,
    referral_code
  )
  values (
    new.id,
    false,
    'trial',
    coalesce(new.created_at, now()),
    new.email,
    coalesce(new.created_at, now()),
    coalesce(new.created_at, now()) + interval '14 days',
    true,
    public.generate_referral_code()
  )
  on conflict (id) do update set
    email = excluded.email,
    created_at = coalesce(public.users.created_at, excluded.created_at),
    trial_start_date = coalesce(public.users.trial_start_date, excluded.trial_start_date),
    trial_end_date = coalesce(public.users.trial_end_date, excluded.trial_end_date),
    referral_code = coalesce(public.users.referral_code, excluded.referral_code);

  return new;
end;
$$;

-- Best-effort: users still in their trial window but marked plan 'free' → 'trial'.
update public.users u
set
  plan = 'trial',
  is_trial_active = true,
  trial_start_date = coalesce(u.trial_start_date, u.created_at, au.created_at),
  trial_end_date = coalesce(
    u.trial_end_date,
    coalesce(u.created_at, au.created_at) + interval '14 days'
  )
from auth.users au
where au.id = u.id
  and u.plan = 'free'
  and u.is_pro is not true
  and coalesce(u.trial_end_date, u.created_at + interval '14 days', au.created_at + interval '14 days')
    > now();
