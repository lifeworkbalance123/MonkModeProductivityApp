-- One-time: copy legacy weekly "anchor" rows (2000-01-01) into schedule_templates
-- for users who do not already have a template row. Safe to re-run (skips existing).

INSERT INTO public.schedule_templates (
  user_id,
  start_time,
  increment_minutes,
  block_count,
  blocks,
  updated_at
)
SELECT
  ps.user_id,
  (MIN(ps.time_slot))::text,
  60,
  LEAST(20, GREATEST(1, COUNT(*)::int)),
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'time', ps.time_slot,
        'category', ps.category,
        'label', COALESCE(ps.activity, '')
      )
      ORDER BY ps.time_slot
    ),
    '[]'::jsonb
  ),
  NOW()
FROM public.planner_slots ps
WHERE ps.date = '2000-01-01'
GROUP BY ps.user_id
HAVING NOT EXISTS (
  SELECT 1
  FROM public.schedule_templates st
  WHERE st.user_id = ps.user_id
)
ON CONFLICT (user_id) DO NOTHING;
