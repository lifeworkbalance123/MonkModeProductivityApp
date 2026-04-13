-- V2 checklist: default wake time for new rows (onboarding spec)
ALTER TABLE public.users
  ALTER COLUMN wake_time SET DEFAULT '06:00';
