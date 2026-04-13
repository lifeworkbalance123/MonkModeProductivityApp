-- Public catalog of training videos (admin-managed via /admin/videos + API)

CREATE TABLE IF NOT EXISTS public.training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS training_videos_sort_order_idx
  ON public.training_videos (sort_order ASC, created_at DESC);

ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_videos_select_public"
  ON public.training_videos
  FOR SELECT
  USING (true);

CREATE POLICY "training_videos_insert_admin"
  ON public.training_videos
  FOR INSERT
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "training_videos_update_admin"
  ON public.training_videos
  FOR UPDATE
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "training_videos_delete_admin"
  ON public.training_videos
  FOR DELETE
  USING (public.is_current_user_admin());

GRANT SELECT ON public.training_videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.training_videos TO authenticated;
