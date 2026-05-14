-- Seven curated colour themes (noir, slate, terrain, bloom, vapor, harvest, midnight).
-- Replaces stoic / zen / nomad / forge / silent / rose / lavender / peach / sage.

ALTER TABLE public.theme_personas DROP CONSTRAINT IF EXISTS theme_personas_id_check;

DELETE FROM public.theme_personas;

INSERT INTO public.theme_personas (id, display_name, description)
VALUES
  (
    'noir',
    'Noir',
    'Deep black canvas with electric cyan accents — high contrast and minimal.'
  ),
  (
    'slate',
    'Slate',
    'Cool navy panels with antique gold highlights — refined and steady.'
  ),
  (
    'terrain',
    'Terrain',
    'Warm earth browns and terracotta — grounded, organic focus.'
  ),
  (
    'bloom',
    'Bloom',
    'Soft cream surfaces with coral accents — bright and approachable.'
  ),
  (
    'vapor',
    'Vapor',
    'Near-black shell with neon magenta and cyan energy — synth-night clarity.'
  ),
  (
    'harvest',
    'Harvest',
    'Solar paper tones with golden wheat accents — warm daylight reading.'
  ),
  (
    'midnight',
    'Midnight',
    'Indigo depths with amethyst accents — calm late-night work.'
  );

ALTER TABLE public.theme_personas
  ADD CONSTRAINT theme_personas_id_check CHECK (
    id IN ('noir', 'slate', 'terrain', 'bloom', 'vapor', 'harvest', 'midnight')
  );

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_theme_preference_check;

UPDATE public.users
SET
  theme_preference = CASE theme_preference
    WHEN 'stoic' THEN 'noir'
    WHEN 'zen' THEN 'bloom'
    WHEN 'nomad' THEN 'slate'
    WHEN 'forge' THEN 'terrain'
    WHEN 'silent' THEN 'midnight'
    WHEN 'rose' THEN 'bloom'
    WHEN 'lavender' THEN 'midnight'
    WHEN 'peach' THEN 'harvest'
    WHEN 'sage' THEN 'terrain'
    WHEN 'sanctuary' THEN 'slate'
    ELSE theme_preference
  END
WHERE
  theme_preference IN (
    'stoic',
    'zen',
    'nomad',
    'forge',
    'silent',
    'rose',
    'lavender',
    'peach',
    'sage',
    'sanctuary'
  );

UPDATE public.users
SET theme_preference = 'noir'
WHERE
  theme_preference IS NULL
  OR theme_preference NOT IN ('noir', 'slate', 'terrain', 'bloom', 'vapor', 'harvest', 'midnight');

ALTER TABLE public.users ALTER COLUMN theme_preference SET DEFAULT 'noir';

ALTER TABLE public.users
  ADD CONSTRAINT users_theme_preference_check CHECK (
    theme_preference IN ('noir', 'slate', 'terrain', 'bloom', 'vapor', 'harvest', 'midnight')
  );
