-- Buddy witness links: rows that already have a slug were created with witness_enabled = false
-- by default. If a slug exists, the share link should work unless the user turns sharing off.
-- New slug creation in code sets witness_enabled = true; this backfills older rows once.

UPDATE public.user_programs
SET witness_enabled = true
WHERE witness_slug IS NOT NULL
  AND witness_enabled = false;
