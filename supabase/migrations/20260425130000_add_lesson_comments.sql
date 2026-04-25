-- Social comments, likes, and share analytics for CMS daily lessons (daily_lessons).

CREATE TABLE IF NOT EXISTS public.lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.daily_lessons (id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.lesson_comments (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lesson_comments_content_nonempty CHECK (length(trim(content)) > 0)
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.lesson_comments (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, comment_id)
);

CREATE TABLE IF NOT EXISTS public.lesson_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.daily_lessons (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS lesson_comments_set_updated_at ON public.lesson_comments;
CREATE TRIGGER lesson_comments_set_updated_at
  BEFORE UPDATE ON public.lesson_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.sync_lesson_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lesson_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lesson_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS comment_likes_sync_count_ins ON public.comment_likes;
CREATE TRIGGER comment_likes_sync_count_ins
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_lesson_comment_likes_count();

DROP TRIGGER IF EXISTS comment_likes_sync_count_del ON public.comment_likes;
CREATE TRIGGER comment_likes_sync_count_del
  AFTER DELETE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_lesson_comment_likes_count();

REVOKE ALL ON FUNCTION public.sync_lesson_comment_likes_count() FROM PUBLIC;

ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comments" ON public.lesson_comments;
CREATE POLICY "Anyone can read comments"
  ON public.lesson_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Auth users can insert comments" ON public.lesson_comments;
CREATE POLICY "Auth users can insert comments"
  ON public.lesson_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.lesson_comments;
CREATE POLICY "Users can update own comments"
  ON public.lesson_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.lesson_comments;
CREATE POLICY "Users can delete own comments"
  ON public.lesson_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read likes" ON public.comment_likes;
CREATE POLICY "Anyone can read likes"
  ON public.comment_likes
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Auth users can like" ON public.comment_likes;
CREATE POLICY "Auth users can like"
  ON public.comment_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike" ON public.comment_likes;
CREATE POLICY "Users can unlike"
  ON public.comment_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read shares" ON public.lesson_shares;
CREATE POLICY "Anyone can read shares"
  ON public.lesson_shares
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Auth users can share" ON public.lesson_shares;
CREATE POLICY "Auth users can share"
  ON public.lesson_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_comments_lesson_id
  ON public.lesson_comments (lesson_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_lesson_comments_parent_id
  ON public.lesson_comments (parent_comment_id)
  WHERE parent_comment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_shares_lesson_id ON public.lesson_shares (lesson_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_comments TO authenticated;
GRANT SELECT ON public.lesson_comments TO anon;

GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT SELECT ON public.comment_likes TO anon;

GRANT SELECT, INSERT ON public.lesson_shares TO authenticated;
GRANT SELECT ON public.lesson_shares TO anon;

COMMENT ON TABLE public.lesson_comments IS 'Threaded comments on a CMS daily_lessons row; parent_comment_id null = top-level.';
COMMENT ON TABLE public.comment_likes IS 'Per-user like on a comment; likes_count on lesson_comments maintained by trigger.';
COMMENT ON TABLE public.lesson_shares IS 'Opt-in analytics when a user shares a lesson link.';
