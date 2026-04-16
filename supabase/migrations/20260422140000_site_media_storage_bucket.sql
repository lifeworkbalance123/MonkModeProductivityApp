-- Public bucket for landing hero images/videos (see app/(admin)/admin/hero/page.tsx)

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "site-media public read" ON storage.objects;
CREATE POLICY "site-media public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'site-media');

DROP POLICY IF EXISTS "site-media admin insert" ON storage.objects;
CREATE POLICY "site-media admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'site-media'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "site-media admin update" ON storage.objects;
CREATE POLICY "site-media admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'site-media'
    AND public.is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'site-media'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "site-media admin delete" ON storage.objects;
CREATE POLICY "site-media admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'site-media'
    AND public.is_admin(auth.uid())
  );
