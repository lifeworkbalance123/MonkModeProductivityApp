-- Optional JSON snapshot at celebration time (counts, program context).

ALTER TABLE public.user_milestones
  ADD COLUMN IF NOT EXISTS analytics_snapshot JSONB;

COMMENT ON COLUMN public.user_milestones.analytics_snapshot IS 'Point-in-time metrics when milestone was recorded (e.g. completed day count).';
