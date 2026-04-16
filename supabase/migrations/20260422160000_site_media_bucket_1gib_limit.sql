-- Raise site-media upload cap for hero / landing videos (was 100 MiB in API-only setups).

UPDATE storage.buckets
SET file_size_limit = 1073741824
WHERE id = 'site-media';
