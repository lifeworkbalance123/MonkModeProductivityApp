-- Server-side entitlement: Stripe columns, plan enum, remove client updates to is_pro/plan, webhook_logs.

alter table public.users
  add column if not exists stripe_customer_id text;

alter table public.users
  add column if not exists stripe_subscription_id text;

alter table public.users
  add column if not exists subscription_end_date timestamptz;

-- Normalize legacy plan labels before CHECK constraint
update public.users
set plan = 'monthly'
where lower(trim(plan)) in ('pro', 'paid');

update public.users
set plan = 'free'
where plan is null
   or trim(plan) = ''
   or lower(trim(plan)) not in ('free', 'monthly', 'lifetime');

alter table public.users drop constraint if exists users_plan_check;

alter table public.users
  add constraint users_plan_check
  check (plan in ('free', 'monthly', 'lifetime'));

-- Only service role may change billing fields (RLS bypass). Authenticated JWT cannot UPDATE rows.
drop policy if exists "users_update_own" on public.users;
drop policy if exists "users_update_if_admin" on public.users;

create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  stripe_event_id text not null,
  user_id uuid references public.users (id) on delete set null,
  success boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists webhook_logs_created_at_idx
  on public.webhook_logs (created_at desc);

alter table public.webhook_logs enable row level security;
