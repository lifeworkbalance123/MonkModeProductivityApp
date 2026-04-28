-- Admin moderation workflow for lesson comments (/admin/comments).

ALTER TABLE public.lesson_comments
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'pending';

COMMENT ON COLUMN public.lesson_comments.moderation_status IS
  'pending = awaiting admin review; reviewed = cleared in admin. New rows default to pending; existing rows backfilled to reviewed.';

UPDATE public.lesson_comments SET moderation_status = 'reviewed';

ALTER TABLE public.lesson_comments
  ALTER COLUMN moderation_status SET DEFAULT 'pending';

ALTER TABLE public.lesson_comments DROP CONSTRAINT IF EXISTS lesson_comments_moderation_status_check;
ALTER TABLE public.lesson_comments
  ADD CONSTRAINT lesson_comments_moderation_status_check
  CHECK (moderation_status IN ('pending', 'reviewed'));
