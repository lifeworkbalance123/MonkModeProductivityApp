-- Ensures companion media columns exist (fixes PostgREST "schema cache" errors on lessons save).
-- Safe to re-run: ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS companion_media_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS companion_media_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS companion_media_storage_path TEXT DEFAULT NULL;

ALTER TABLE public.onboarding_content
  ADD COLUMN IF NOT EXISTS companion_media_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS companion_media_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS companion_media_storage_path TEXT DEFAULT NULL;

NOTIFY pgrst, 'reload schema';
