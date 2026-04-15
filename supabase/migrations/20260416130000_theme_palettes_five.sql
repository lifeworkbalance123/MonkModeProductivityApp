-- Five colour palettes (stoic, zen, nomad, forge, silent). Replaces legacy forge / sanctuary / sage.

ALTER TABLE public.theme_personas DROP CONSTRAINT IF EXISTS theme_personas_id_check;

DELETE FROM public.theme_personas;

INSERT INTO public.theme_personas (id, display_name, description)
VALUES
  (
    'stoic',
    'The Stoic',
    'Dark canvas and amber gold — the default disciplined look.'
  ),
  (
    'zen',
    'Zen Monochrome',
    'Warm off-white and soft grey — a calm light workspace.'
  ),
  (
    'nomad',
    'Digital Nomad',
    'Deep navy with sand accents — travel-ready focus.'
  ),
  (
    'forge',
    'The Forge',
    'Charcoal steel and ember orange — high intensity.'
  ),
  (
    'silent',
    'Silent Monk',
    'Greyscale interface; gold reserved for key actions only.'
  );

ALTER TABLE public.theme_personas
  ADD CONSTRAINT theme_personas_id_check CHECK (
    id IN ('stoic', 'zen', 'nomad', 'forge', 'silent')
  );

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_theme_preference_check;

UPDATE public.users
SET
  theme_preference = CASE theme_preference
    WHEN 'forge' THEN 'stoic'
    WHEN 'sanctuary' THEN 'nomad'
    WHEN 'sage' THEN 'silent'
    ELSE theme_preference
  END
WHERE
  theme_preference IN ('forge', 'sanctuary', 'sage');

UPDATE public.users
SET theme_preference = 'stoic'
WHERE
  theme_preference IS NULL
  OR theme_preference NOT IN ('stoic', 'zen', 'nomad', 'forge', 'silent');

ALTER TABLE public.users ALTER COLUMN theme_preference SET DEFAULT 'stoic';

ALTER TABLE public.users
  ADD CONSTRAINT users_theme_preference_check CHECK (
    theme_preference IN ('stoic', 'zen', 'nomad', 'forge', 'silent')
  );
