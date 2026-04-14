-- Run in Supabase SQL Editor: RLS status for all public tables
-- Step 1 — Any row with rowsecurity = false needs review.

SELECT schemaname, tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 3 — RLS + policy counts (expect rls_enabled true and policy_count >= 1 for user data)

SELECT
  t.tablename,
  t.rowsecurity AS rls_enabled,
  (
    SELECT count(*)::int
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = t.tablename
  ) AS policy_count
FROM pg_tables t
WHERE t.schemaname = 'public'
ORDER BY t.tablename;
