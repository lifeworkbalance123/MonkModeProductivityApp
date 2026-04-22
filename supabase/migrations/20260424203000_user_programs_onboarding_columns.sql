-- Resume / completion tracking for the program onboarding flow.

ALTER TABLE public.user_programs
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

ALTER TABLE public.user_programs
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
