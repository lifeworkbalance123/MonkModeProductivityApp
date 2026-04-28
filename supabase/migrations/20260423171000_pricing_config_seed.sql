-- Default display prices (cents, USD). Safe to re-run: skips rows that already exist.

INSERT INTO public.pricing_config (id, name, full_price, current_price, currency, is_launch_special)
VALUES
  ('app_monthly', 'Pro Monthly', 799, 799, 'USD', false),
  ('app_annual', 'Pro Annual', 9588, 4999, 'USD', false),
  ('monk_mode', 'Monk Mode (21d)', 2900, 1900, 'USD', true),
  ('sprint', 'Sprint (30d)', 3900, 2900, 'USD', true),
  ('transform', 'Transform (60d)', 5900, 4900, 'USD', true)
ON CONFLICT (id) DO NOTHING;
