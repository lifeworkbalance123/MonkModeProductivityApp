-- Ensure daily_logs contains all program completion flags used by APIs/UI.
-- Safe to run multiple times across environments.

ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS evening_checkin_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lemon_water_done BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS micro_journal_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_out_bedroom BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS weekly_anchor_done BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS core_action_completed BOOLEAN DEFAULT false;

