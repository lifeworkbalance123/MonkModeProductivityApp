-- Align public.program display prices with launch SKUs (cents, USD).
-- Stripe still charges whatever each STRIPE_PRICE_* Price ID is set to in Dashboard.

UPDATE public.pricing_config
SET
  name = 'Sprint (30 days)',
  full_price = 3999,
  current_price = 2999,
  currency = 'USD',
  is_launch_special = true,
  updated_at = NOW()
WHERE id = 'sprint';

UPDATE public.pricing_config
SET
  name = 'Monk Mode (21 days)',
  full_price = 2900,
  current_price = 1999,
  currency = 'USD',
  is_launch_special = true,
  updated_at = NOW()
WHERE id = 'monk_mode';

UPDATE public.pricing_config
SET
  name = 'Transform (60 days)',
  full_price = 5900,
  current_price = 4999,
  currency = 'USD',
  is_launch_special = true,
  updated_at = NOW()
WHERE id = 'transform';
