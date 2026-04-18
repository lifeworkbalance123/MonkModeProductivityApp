-- Editable theme personas (display copy) + user color theme preference
-- Timestamp 16125000: must not collide with 20260416120000_onboarding_display_order.sql
-- If 20260416130000_theme_palettes_five already ran (remote repair order), skip legacy seed + user bootstrap.

CREATE TABLE IF NOT EXISTS public.theme_personas (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT theme_personas_id_check CHECK (id IN ('forge', 'sanctuary', 'sage'))
);

INSERT INTO public.theme_personas (id, display_name, description)
SELECT v.id, v.display_name, v.description
FROM (
  VALUES
    ('forge', 'The Forge', 'Intense, gritty — for the warrior.'),
    ('sanctuary', 'The Sanctuary', 'Calm, focused — teal clarity.'),
    ('sage', 'The Sage', 'Warm stone and olive — grounded wisdom.')
) AS v(id, display_name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.theme_personas WHERE id = 'stoic' LIMIT 1);

ALTER TABLE public.theme_personas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "theme_personas_select_authenticated" ON public.theme_personas;
CREATE POLICY "theme_personas_select_authenticated"
  ON public.theme_personas
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "theme_personas_all_admin" ON public.theme_personas;
CREATE POLICY "theme_personas_all_admin"
  ON public.theme_personas
  FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.theme_personas WHERE id = 'stoic' LIMIT 1) THEN
    RETURN;
  END IF;

  ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS theme_preference TEXT;

  UPDATE public.users
  SET theme_preference = 'forge'
  WHERE theme_preference IS NULL
     OR theme_preference NOT IN ('forge', 'sanctuary', 'sage');

  ALTER TABLE public.users
    ALTER COLUMN theme_preference SET DEFAULT 'forge';

  ALTER TABLE public.users
    ALTER COLUMN theme_preference SET NOT NULL;

  ALTER TABLE public.users
    DROP CONSTRAINT IF EXISTS users_theme_preference_check;

  ALTER TABLE public.users
    ADD CONSTRAINT users_theme_preference_check
    CHECK (theme_preference IN ('forge', 'sanctuary', 'sage'));
END $$;
