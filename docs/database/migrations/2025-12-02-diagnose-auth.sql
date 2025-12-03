-- ============================================================================
-- Diagnostic Script: Check Authentication and RLS Configuration
-- Date: 2025-12-02
-- Description: Verify that authentication and RLS are properly configured
-- ============================================================================

-- NOTE: When running in SQL Editor, auth.uid() will be NULL because you're
-- running as service role. This is EXPECTED. The app should pass auth context.

-- ============================================================================
-- PART 1: Verify Helper Functions Exist
-- ============================================================================

-- Check if helper functions exist
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_user_in_versus', 'is_user_commissioner')
ORDER BY routine_name;

-- ============================================================================
-- PART 2: Verify RLS Policies
-- ============================================================================

-- View all policies on all tables
SELECT 
  tablename,
  policyname,
  cmd as command,
  permissive,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- PART 3: Check Table RLS Status
-- ============================================================================

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('players', 'versus', 'versus_players', 'objectives', 'completions')
ORDER BY tablename;

-- ============================================================================
-- PART 4: Test with Service Role (bypasses RLS)
-- ============================================================================

-- This should work even with RLS because service role bypasses it
-- Test if you can insert a test record (we'll delete it after)
-- Replace 'YOUR_USER_ID' with your actual user ID: 6de06681-09cc-4c2f-bd02-8b4920f5e656

-- UNCOMMENT TO TEST INSERT:
/*
BEGIN;

-- Try to insert a test versus
INSERT INTO versus (name, type, reverse_ranking, created_by)
VALUES ('TEST - DELETE ME', 'Other', false, '6de06681-09cc-4c2f-bd02-8b4920f5e656')
RETURNING id, name, created_by;

-- Check if it was inserted
SELECT * FROM versus WHERE name = 'TEST - DELETE ME';

-- Clean up - delete the test record
DELETE FROM versus WHERE name = 'TEST - DELETE ME';

ROLLBACK;
*/

-- ============================================================================
-- PART 5: Check if player record exists
-- ============================================================================

-- Verify that your user has a player record
-- This is REQUIRED for the versus creation to work
SELECT 
  id,
  email,
  display_name,
  created_at
FROM players
WHERE id = '6de06681-09cc-4c2f-bd02-8b4920f5e656';

-- If this returns no rows, that's a problem! 
-- The player record should have been auto-created when you signed up.

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Diagnostic queries completed!';
    RAISE NOTICE '';
    RAISE NOTICE 'Review the results above:';
    RAISE NOTICE '  1. Helper functions should exist (is_user_in_versus, is_user_commissioner)';
    RAISE NOTICE '  2. All tables should have RLS enabled = true';
    RAISE NOTICE '  3. Policies should exist for all tables';
    RAISE NOTICE '  4. Your player record MUST exist (check last query)';
    RAISE NOTICE '';
    RAISE NOTICE 'If player record does NOT exist, run:';
    RAISE NOTICE '  INSERT INTO players (id, email, display_name)';
    RAISE NOTICE '  VALUES (''6de06681-09cc-4c2f-bd02-8b4920f5e656'', ''your@email.com'', ''Your Name'');';
END $$;

