-- ============================================================================
-- Migration: Fix versus_players RLS Policy for Versus Creation
-- Date: 2025-12-01
-- Description: Allow Versus creators to add themselves as the first player
-- ============================================================================

-- PROBLEM:
-- When creating a new Versus, the flow is:
--   1. Create versus record (user is created_by)
--   2. Create versus_players record (add creator as commissioner)
--
-- But the current policy for versus_players INSERT requires:
--   is_user_commissioner(versus_id) = true
--
-- This creates a chicken-and-egg problem:
-- - User can't be a commissioner until they're in versus_players
-- - User can't insert into versus_players because they're not a commissioner
--
-- SOLUTION:
-- Update the policy to allow EITHER:
-- - The versus creator to add the first player (themselves)
-- - OR existing commissioners to add additional players

-- ============================================================================
-- STEP 1: Drop the existing policy
-- ============================================================================

DROP POLICY IF EXISTS "Commissioners can add players to versus" ON versus_players;

-- ============================================================================
-- STEP 2: Create updated policy
-- ============================================================================

-- Allow versus creators to add players (including themselves) 
-- OR allow commissioners to add players
CREATE POLICY "Versus creators and commissioners can add players"
  ON versus_players FOR INSERT
  WITH CHECK (
    -- Allow the creator of the versus to add players
    EXISTS (
      SELECT 1 FROM versus
      WHERE id = versus_id
      AND created_by = auth.uid()
    )
    OR
    -- Allow existing commissioners to add players
    is_user_commissioner(versus_id)
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'versus_players' AND policyname LIKE '%players%';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'versus_players INSERT policy now allows:';
    RAISE NOTICE '  1. Versus creators to add players';
    RAISE NOTICE '  2. Commissioners to add players';
END $$;

