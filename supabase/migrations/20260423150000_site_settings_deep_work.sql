-- Admin-managed Deep Work copy + optional MP3 ambient tracks (site_settings rows).

INSERT INTO public.site_settings (key, value, media_type, media_url, media_storage_path)
VALUES ('deep_work_intro', '', NULL, NULL, NULL)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value, media_type, media_url, media_storage_path)
VALUES
  ('deep_work_mp3_1', 'Track 1', NULL, NULL, NULL),
  ('deep_work_mp3_2', 'Track 2', NULL, NULL, NULL),
  ('deep_work_mp3_3', 'Track 3', NULL, NULL, NULL)
ON CONFLICT (key) DO NOTHING;
