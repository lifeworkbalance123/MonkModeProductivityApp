-- Media attachments, bonus lessons per day, onboarding media; relax unique day_number

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_storage_path TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_bonus BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_day_number INT DEFAULT NULL;

ALTER TABLE public.onboarding_content
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_storage_path TEXT DEFAULT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lessons_day_number_key'
  ) THEN
    ALTER TABLE public.lessons DROP CONSTRAINT lessons_day_number_key;
  END IF;
END $$;

ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_day_is_bonus_key;

CREATE UNIQUE INDEX IF NOT EXISTS lessons_day_bonus_unique
  ON public.lessons (day_number, is_bonus);

-- Storage bucket row (API route may set size/MIME limits on create)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-media', 'lesson-media', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "lesson-media public read" ON storage.objects;
CREATE POLICY "lesson-media public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'lesson-media');

DROP POLICY IF EXISTS "lesson-media admin insert" ON storage.objects;
CREATE POLICY "lesson-media admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-media'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "lesson-media admin update" ON storage.objects;
CREATE POLICY "lesson-media admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lesson-media'
    AND public.is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'lesson-media'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "lesson-media admin delete" ON storage.objects;
CREATE POLICY "lesson-media admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lesson-media'
    AND public.is_admin(auth.uid())
  );
