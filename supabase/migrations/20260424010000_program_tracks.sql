-- Configurable onboarding program cards (MVP): labels/copy/pricing/order/active.

CREATE TABLE IF NOT EXISTS public.program_tracks (
  id text PRIMARY KEY CHECK (id IN ('sprint_standard', 'sprint_monk', 'transform')),
  label text NOT NULL,
  duration text NOT NULL,
  benefit text NOT NULL,
  intensity text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  checkout_plan text NOT NULL CHECK (checkout_plan IN ('sprint', 'monk_mode', 'transform')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS program_tracks_set_updated_at ON public.program_tracks;
CREATE TRIGGER program_tracks_set_updated_at
  BEFORE UPDATE ON public.program_tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.program_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read program_tracks" ON public.program_tracks;
CREATE POLICY "Public read program_tracks"
  ON public.program_tracks
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage program_tracks" ON public.program_tracks;
CREATE POLICY "Admins manage program_tracks"
  ON public.program_tracks
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.program_tracks TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_tracks TO authenticated;

INSERT INTO public.program_tracks (
  id,
  label,
  duration,
  benefit,
  intensity,
  price_cents,
  currency,
  checkout_plan,
  sort_order,
  is_active
)
VALUES
  (
    'sprint_standard',
    'Sprint',
    '30 days',
    'Build focus stamina with a daily execution rhythm.',
    'Medium',
    2999,
    'USD',
    'sprint',
    1,
    true
  ),
  (
    'sprint_monk',
    'Monk Mode',
    '21 days',
    'Ship one big project with deep-work blocks every day.',
    'High',
    1999,
    'USD',
    'monk_mode',
    2,
    true
  ),
  (
    'transform',
    'Transform',
    '60 days',
    'Rewrite defaults: wake, sleep, anchors, and identity.',
    'Steady',
    4999,
    'USD',
    'transform',
    3,
    true
  )
ON CONFLICT (id) DO UPDATE
SET
  label = EXCLUDED.label,
  duration = EXCLUDED.duration,
  benefit = EXCLUDED.benefit,
  intensity = EXCLUDED.intensity,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  checkout_plan = EXCLUDED.checkout_plan,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
