-- ============================================================================
-- TEMPORARY: Disable RLS on versus table to test if that's the issue
-- Date: 2025-12-02
-- Description: Temporarily disable RLS to isolate the problem
-- ============================================================================

-- WARNING: This temporarily removes security checks on the versus table!
-- Only use this for testing, then re-enable RLS immediately after.

-- Disable RLS on versus table
ALTER TABLE versus DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'versus';

-- ============================================================================
-- AFTER TESTING, RE-ENABLE RLS WITH THIS:
-- ============================================================================
/*
ALTER TABLE versus ENABLE ROW LEVEL SECURITY;
*/

DO $$ 
BEGIN
    RAISE NOTICE '⚠️  RLS DISABLED on versus table';
    RAISE NOTICE 'This is for testing only!';
    RAISE NOTICE 'After testing, run: ALTER TABLE versus ENABLE ROW LEVEL SECURITY;';
END $$;

