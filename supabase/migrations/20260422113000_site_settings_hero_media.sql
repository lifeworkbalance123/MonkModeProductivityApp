CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  media_type TEXT DEFAULT NULL,
  media_url TEXT DEFAULT NULL,
  media_storage_path TEXT DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings"
  ON public.site_settings
  FOR ALL
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Public read site settings" ON public.site_settings;
CREATE POLICY "Public read site settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

INSERT INTO public.site_settings (key, value, media_type, media_url)
VALUES ('hero_media', 'Hero section media', NULL, NULL)
ON CONFLICT (key) DO NOTHING;
