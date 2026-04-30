-- Allow large ambient MP3s for Deep Work (e.g. 100MB+); default bucket cap is often 50 MiB.

UPDATE storage.buckets
SET file_size_limit = 536870912
WHERE id = 'lesson-media';
