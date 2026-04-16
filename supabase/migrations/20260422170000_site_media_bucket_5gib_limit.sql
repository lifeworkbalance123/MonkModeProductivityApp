-- Raise site-media per-object limit for large hero/rhythm MP4s (default app cap is now 5 GiB).

UPDATE storage.buckets
SET file_size_limit = 5368709120
WHERE id = 'site-media';
