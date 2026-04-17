-- Blog posts + public blog-images bucket (policies mirror site-media)

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  slug text UNIQUE NOT NULL,
  excerpt text DEFAULT '',
  content text DEFAULT '',
  cover_image_url text,
  cover_image_path text,
  category text DEFAULT 'Productivity',
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  meta_title text DEFAULT '',
  meta_description text DEFAULT '',
  og_image_url text,
  read_time_minutes integer NOT NULL DEFAULT 5,
  view_count integer NOT NULL DEFAULT 0,
  author_name text DEFAULT 'monkcubed team',
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_status_check CHECK (status IN ('draft', 'published'))
);

CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_status_published_at_idx ON public.blog_posts (status, published_at DESC NULLS LAST);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage blog posts" ON public.blog_posts;
CREATE POLICY "Admins manage blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read published posts" ON public.blog_posts;
CREATE POLICY "Public read published posts"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE OR REPLACE FUNCTION public.increment_blog_view_count(post_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.blog_posts
  SET view_count = view_count + 1
  WHERE slug = post_slug
    AND status = 'published';
$$;

REVOKE ALL ON FUNCTION public.increment_blog_view_count(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_blog_view_count(text) TO anon, authenticated, service_role;

-- Storage: blog-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "blog-images public read" ON storage.objects;
CREATE POLICY "blog-images public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "blog-images admin insert" ON storage.objects;
CREATE POLICY "blog-images admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blog-images'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "blog-images admin update" ON storage.objects;
CREATE POLICY "blog-images admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND public.is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'blog-images'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "blog-images admin delete" ON storage.objects;
CREATE POLICY "blog-images admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND public.is_admin(auth.uid())
  );
