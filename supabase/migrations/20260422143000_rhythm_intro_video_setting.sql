INSERT INTO public.site_settings (key, value, media_type, media_url, media_storage_path)
VALUES (
  'rhythm_intro_video',
  'Discipline x Focus x Productivity section video',
  NULL,
  NULL,
  NULL
)
ON CONFLICT (key) DO NOTHING;
