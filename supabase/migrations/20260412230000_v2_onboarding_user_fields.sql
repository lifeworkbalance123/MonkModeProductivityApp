-- V2 onboarding profile fields

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS wake_time TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
