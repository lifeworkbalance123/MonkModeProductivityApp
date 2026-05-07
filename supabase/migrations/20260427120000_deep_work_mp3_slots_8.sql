-- Deep Work: up to 8 MP3 slots + per-row visibility toggle for the Focus page.

ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

INSERT INTO public.site_settings (key, value, media_type, media_url, media_storage_path, is_active)
VALUES
  ('deep_work_mp3_4', 'Track 4', NULL, NULL, NULL, true),
  ('deep_work_mp3_5', 'Track 5', NULL, NULL, NULL, true),
  ('deep_work_mp3_6', 'Track 6', NULL, NULL, NULL, true),
  ('deep_work_mp3_7', 'Track 7', NULL, NULL, NULL, true),
  ('deep_work_mp3_8', 'Track 8', NULL, NULL, NULL, true)
ON CONFLICT (key) DO NOTHING;
