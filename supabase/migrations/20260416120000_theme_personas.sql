-- Editable theme personas (display copy) + user color theme preference

CREATE TABLE IF NOT EXISTS public.theme_personas (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT theme_personas_id_check CHECK (id IN ('forge', 'sanctuary', 'sage'))
);

INSERT INTO public.theme_personas (id, display_name, description)
VALUES
  ('forge', 'The Forge', 'Intense, gritty — for the warrior.'),
  ('sanctuary', 'The Sanctuary', 'Calm, focused — teal clarity.'),
  ('sage', 'The Sage', 'Warm stone and olive — grounded wisdom.')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.theme_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme_personas_select_authenticated"
  ON public.theme_personas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "theme_personas_all_admin"
  ON public.theme_personas
  FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

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
