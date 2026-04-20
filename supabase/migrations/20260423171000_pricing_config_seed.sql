-- Default display prices (cents, AUD). Safe to re-run: skips rows that already exist.

INSERT INTO public.pricing_config (id, name, full_price, current_price, is_launch_special)
VALUES
  ('app_monthly', 'App Monthly', 999, 999, false),
  ('app_annual', 'App Annual', 7999, 7999, false),
  ('monk_mode', 'Monk Mode (21d)', 2900, 1900, true),
  ('sprint', 'Sprint (30d)', 3900, 2900, true),
  ('transform', 'Transform (60d)', 5900, 4900, true)
ON CONFLICT (id) DO NOTHING;
