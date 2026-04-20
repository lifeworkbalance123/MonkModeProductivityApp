-- CMS-style display pricing (cents). Keys are stable app identifiers (e.g. Stripe-facing labels).

CREATE TABLE IF NOT EXISTS public.pricing_config (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  full_price INTEGER,
  current_price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  is_launch_special BOOLEAN NOT NULL DEFAULT false,
  launch_special_end_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pricing_config_current_price_non_negative CHECK (current_price >= 0),
  CONSTRAINT pricing_config_full_price_non_negative CHECK (full_price IS NULL OR full_price >= 0)
);

COMMENT ON TABLE public.pricing_config IS 'Optional display prices for marketing/checkout copy; not a substitute for Stripe Price IDs.';

CREATE INDEX IF NOT EXISTS pricing_config_launch_special_idx
  ON public.pricing_config (is_launch_special)
  WHERE is_launch_special = true;

DROP TRIGGER IF EXISTS pricing_config_set_updated_at ON public.pricing_config;
CREATE TRIGGER pricing_config_set_updated_at
  BEFORE UPDATE ON public.pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage pricing_config" ON public.pricing_config;
CREATE POLICY "Admins manage pricing_config"
  ON public.pricing_config
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read pricing_config" ON public.pricing_config;
CREATE POLICY "Public read pricing_config"
  ON public.pricing_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.pricing_config TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_config TO authenticated;
