-- One Big Task per user per calendar day (dashboard / program UI)
-- Timestamp 17121000: must not collide with 20260417120000_blog_posts_and_blog_images.sql

CREATE TABLE IF NOT EXISTS public.user_big_task (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  task_text TEXT NOT NULL,
  date DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS user_big_task_user_date_idx
  ON public.user_big_task (user_id, date DESC);

ALTER TABLE public.user_big_task ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_big_task_select_own" ON public.user_big_task;
CREATE POLICY "user_big_task_select_own"
  ON public.user_big_task
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_big_task_insert_own" ON public.user_big_task;
CREATE POLICY "user_big_task_insert_own"
  ON public.user_big_task
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_big_task_update_own" ON public.user_big_task;
CREATE POLICY "user_big_task_update_own"
  ON public.user_big_task
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_big_task_delete_own" ON public.user_big_task;
CREATE POLICY "user_big_task_delete_own"
  ON public.user_big_task
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
