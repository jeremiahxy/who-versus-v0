-- ============================================================================
-- Migration: Fix versus table RLS Policy for INSERT
-- Date: 2025-12-02
-- Description: Ensure users can create versus records when they are the creator
-- ============================================================================

-- PROBLEM:
-- Users are getting "new row violates row-level security policy for table "versus""
-- even when auth.uid() matches created_by field.
--
-- POSSIBLE CAUSES:
-- 1. Policy doesn't exist in database
-- 2. Policy was created incorrectly
-- 3. Policy uses wrong syntax
--
-- SOLUTION:
-- Drop and recreate the policy with correct syntax

-- ============================================================================
-- STEP 1: Check current policies (for debugging)
-- ============================================================================

-- View all current policies on versus table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'versus'
ORDER BY policyname;

-- ============================================================================
-- STEP 2: Drop existing INSERT policy if it exists
-- ============================================================================

DROP POLICY IF EXISTS "Users can create versus" ON versus;

-- ============================================================================
-- STEP 3: Recreate the INSERT policy with correct syntax
-- ============================================================================

-- Allow authenticated users to create versus records when they are the creator
CREATE POLICY "Users can create versus"
  ON versus 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- ============================================================================
-- STEP 4: Verify other versus policies exist
-- ============================================================================

-- Ensure SELECT policy exists (users can view versus they participate in)
DROP POLICY IF EXISTS "Users can view versus they participate in" ON versus;
CREATE POLICY "Users can view versus they participate in"
  ON versus 
  FOR SELECT
  TO authenticated
  USING (is_user_in_versus(id));

-- Ensure UPDATE policy exists (commissioners can update)
DROP POLICY IF EXISTS "Commissioners can update their versus" ON versus;
CREATE POLICY "Commissioners can update their versus"
  ON versus 
  FOR UPDATE
  TO authenticated
  USING (is_user_commissioner(id));

-- ============================================================================
-- STEP 5: Ensure RLS is enabled on versus table
-- ============================================================================

ALTER TABLE versus ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View all policies on versus table after migration
SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN cmd = 'INSERT' THEN with_check::text
    WHEN cmd = 'SELECT' THEN qual::text
    WHEN cmd = 'UPDATE' THEN qual::text
    ELSE 'N/A'
  END as policy_expression
FROM pg_policies 
WHERE tablename = 'versus'
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'versus';

-- ============================================================================
-- TEST QUERY (Run after migration)
-- ============================================================================

-- This should show the current user's ID
-- Compare this to the user ID in your logs
SELECT auth.uid() as current_user_id;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'versus table RLS policies:';
    RAISE NOTICE '  ✓ INSERT: Users can create when they are the creator';
    RAISE NOTICE '  ✓ SELECT: Users can view versus they participate in';
    RAISE NOTICE '  ✓ UPDATE: Commissioners can update';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Review verification queries above';
    RAISE NOTICE '  2. Test creating a new Versus in the app';
    RAISE NOTICE '  3. If still failing, check that auth.uid() returns the expected user ID';
END $$;

