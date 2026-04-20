-- Optional second media slot (e.g. banner image + MP3) for daily lessons and onboarding steps.

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS companion_media_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS companion_media_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS companion_media_storage_path TEXT DEFAULT NULL;

ALTER TABLE public.onboarding_content
  ADD COLUMN IF NOT EXISTS companion_media_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS companion_media_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS companion_media_storage_path TEXT DEFAULT NULL;

COMMENT ON COLUMN public.lessons.companion_media_type IS 'When set with companion_media_url, pairs with media_type/media_url (e.g. audio under an image banner).';
COMMENT ON COLUMN public.onboarding_content.companion_media_type IS 'Optional second media for onboarding step (e.g. audio with image).';
