-- Optional "Bonus Track" fields on primary program lesson rows (`is_bonus = false`).
-- Legacy optional rows with `is_bonus = true` remain supported unchanged.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_lessons' AND column_name = 'bonus_label'
  ) THEN
    ALTER TABLE public.daily_lessons ADD COLUMN bonus_label TEXT DEFAULT 'Bonus';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_lessons' AND column_name = 'bonus_title'
  ) THEN
    ALTER TABLE public.daily_lessons ADD COLUMN bonus_title TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_lessons' AND column_name = 'bonus_body'
  ) THEN
    ALTER TABLE public.daily_lessons ADD COLUMN bonus_body TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_lessons' AND column_name = 'bonus_audio_url'
  ) THEN
    ALTER TABLE public.daily_lessons ADD COLUMN bonus_audio_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_lessons' AND column_name = 'bonus_video_url'
  ) THEN
    ALTER TABLE public.daily_lessons ADD COLUMN bonus_video_url TEXT;
  END IF;
END $$;

COMMENT ON COLUMN public.daily_lessons.bonus_label IS 'Section heading for inline bonus track (primary rows only).';
COMMENT ON COLUMN public.daily_lessons.bonus_title IS 'Optional bonus headline.';
COMMENT ON COLUMN public.daily_lessons.bonus_body IS 'Optional bonus markdown body.';
COMMENT ON COLUMN public.daily_lessons.bonus_audio_url IS 'Optional bonus MP3 URL (e.g. lesson-media).';
COMMENT ON COLUMN public.daily_lessons.bonus_video_url IS 'Optional bonus video: YouTube or hosted MP4 URL.';
