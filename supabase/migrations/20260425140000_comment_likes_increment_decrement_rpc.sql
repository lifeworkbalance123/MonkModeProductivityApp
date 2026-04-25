-- Optional RPC helpers to bump lesson_comments.likes_count in isolation.
--
-- Production app flow: insert/delete rows in public.comment_likes only; triggers
-- public.sync_lesson_comment_likes_count() already keep likes_count in sync.
-- Do NOT call these functions after a normal like/unlike insert/delete or counts will double.

CREATE OR REPLACE FUNCTION public.increment_comment_likes(comment_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.lesson_comments
  SET likes_count = likes_count + 1
  WHERE id = comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_comment_likes(comment_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.lesson_comments
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = comment_id;
END;
$$;

COMMENT ON FUNCTION public.increment_comment_likes(uuid) IS
  'Repair/manual only. Normal likes: insert into comment_likes; trigger updates likes_count.';

COMMENT ON FUNCTION public.decrement_comment_likes(uuid) IS
  'Repair/manual only. Normal unlikes: delete from comment_likes; trigger updates likes_count.';

REVOKE ALL ON FUNCTION public.increment_comment_likes(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_comment_likes(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.increment_comment_likes(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_comment_likes(uuid) TO service_role;
