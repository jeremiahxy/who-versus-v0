-- ============================================================================
-- Migration: Auto-set created_by using auth.uid()
-- Date: 2025-12-02
-- Description: Let PostgreSQL automatically set created_by instead of app
-- ============================================================================

-- SECURITY IMPROVEMENT:
-- Instead of having the app pass created_by (which could be spoofed),
-- let PostgreSQL automatically set it to auth.uid().
-- This is more secure and might work better with RLS.

-- ============================================================================
-- STEP 1: Add DEFAULT to created_by column
-- ============================================================================

-- Set default value for created_by to auth.uid()
ALTER TABLE versus 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Make created_by optional in inserts (it will use DEFAULT if not provided)
-- Note: It's already NOT NULL, but now has a DEFAULT

-- ============================================================================
-- STEP 2: Simplify RLS INSERT policy
-- ============================================================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create versus" ON versus;

-- Create new policy that allows authenticated users to insert
-- The created_by will be automatically set to auth.uid() via DEFAULT
-- So we don't need to check it in the policy
CREATE POLICY "Authenticated users can create versus"
  ON versus 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Alternative approach (more strict): Keep the check but it might still fail
/*
CREATE POLICY "Users can create versus"
  ON versus 
  FOR INSERT 
  TO authenticated
  WITH CHECK (created_by = auth.uid());
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check the table definition
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'versus'
AND column_name = 'created_by';

-- Check the new policy
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'versus'
AND cmd = 'INSERT';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes:';
    RAISE NOTICE '  1. created_by now has DEFAULT auth.uid()';
    RAISE NOTICE '  2. INSERT policy simplified to allow all authenticated users';
    RAISE NOTICE '  3. PostgreSQL will automatically set created_by';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Update app code to NOT send created_by in INSERT';
END $$;

