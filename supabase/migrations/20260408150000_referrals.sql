-- Referral system fields
alter table public.users
  add column if not exists referral_code text unique;

alter table public.users
  add column if not exists referred_by text;

alter table public.users
  add column if not exists referral_count int not null default 0;

alter table public.users
  add column if not exists referral_reward_months int not null default 0;

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete cascade,
  referred_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  reward_applied boolean not null default false,
  unique (referrer_user_id, referred_user_id)
);

create index if not exists referral_events_referrer_idx
  on public.referral_events (referrer_user_id);

create index if not exists referral_events_referred_idx
  on public.referral_events (referred_user_id);

-- Generate unique referral code MM + 6 uppercase chars.
create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code text;
  i int;
begin
  loop
    code := 'MM';
    for i in 1..6 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;

    if not exists (
      select 1 from public.users u where u.referral_code = code
    ) then
      return code;
    end if;
  end loop;
end;
$$;

-- Extend existing trigger to seed referral code.
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
    trial_end_date,
    referral_code
  )
  values (
    new.id,
    false,
    'free',
    new.created_at,
    new.email,
    new.created_at + interval '14 days',
    public.generate_referral_code()
  )
  on conflict (id) do update set
    email = excluded.email,
    created_at = excluded.created_at,
    trial_end_date = excluded.trial_end_date,
    referral_code = coalesce(public.users.referral_code, excluded.referral_code);

  return new;
end;
$$;

-- Backfill referral codes for existing users
update public.users
set referral_code = public.generate_referral_code()
where referral_code is null;

create or replace function public.increment_referral_count(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set referral_count = coalesce(referral_count, 0) + 1
  where id = p_user_id;
end;
$$;

