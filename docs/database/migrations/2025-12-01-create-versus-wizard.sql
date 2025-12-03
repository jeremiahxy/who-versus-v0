-- ============================================================================
-- Migration: Create Versus Wizard Support
-- Date: 2025-12-01
-- Description: Add columns to support the multi-step Versus creation wizard
-- ============================================================================

-- This migration adds:
-- 1. type column to versus table (for storing Versus type selection)
-- 2. nickname column to versus_players table (for Versus-specific display names)
-- 3. Renames name to title in objectives table (clearer naming)
-- 4. description column to objectives table (optional explanation)

-- ============================================================================
-- STEP 1: Add type column to versus table
-- ============================================================================

-- Add type column to store Versus type selection
-- Values: 'Scavenger Hunt', 'Fitness Challenge', 'Chore Competition', 'Swear Jar', 'Other'
ALTER TABLE versus ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN versus.type IS 'Type of Versus: Scavenger Hunt, Fitness Challenge, Chore Competition, Swear Jar, Other. Used for conditional UI logic (e.g., reverse ranking).';

-- ============================================================================
-- STEP 2: Add nickname column to versus_players table
-- ============================================================================

-- Add nickname column for Versus-specific display name overrides
-- If NULL, application will use the player's display_name from players table
ALTER TABLE versus_players ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN versus_players.nickname IS 'Optional Versus-specific nickname. If NULL, use players.display_name. Allows different display names per Versus.';

-- ============================================================================
-- STEP 3: Rename name to title in objectives table (if upgrading existing DB)
-- ============================================================================

-- Check if 'name' column exists before renaming
-- If this is a fresh installation, this step will be skipped
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'objectives' 
        AND column_name = 'name'
    ) THEN
        -- Rename name to title for clearer terminology
        ALTER TABLE objectives RENAME COLUMN name TO title;
        
        -- Add comment
        COMMENT ON COLUMN objectives.title IS 'Objective title (e.g., "Run 5 miles"). Renamed from "name" for clarity.';
        
        RAISE NOTICE 'Renamed objectives.name to objectives.title';
    ELSE
        RAISE NOTICE 'Column objectives.name does not exist - skipping rename (likely fresh install)';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Add description column to objectives table
-- ============================================================================

-- Add description column for optional objective explanation
ALTER TABLE objectives ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN objectives.description IS 'Optional explanation or details about the objective. Helps clarify rules or provide context.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after migration to verify success:

-- Check versus table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'versus'
ORDER BY ordinal_position;

-- Check versus_players table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'versus_players'
ORDER BY ordinal_position;

-- Check objectives table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'objectives'
ORDER BY ordinal_position;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- UNCOMMENT BELOW TO ROLLBACK CHANGES
-- WARNING: This will drop data in the new columns!

/*
-- Remove type column from versus
ALTER TABLE versus DROP COLUMN IF EXISTS type;

-- Remove nickname column from versus_players
ALTER TABLE versus_players DROP COLUMN IF EXISTS nickname;

-- Rename title back to name in objectives (if you need to rollback)
ALTER TABLE objectives RENAME COLUMN title TO name;

-- Remove description column from objectives
ALTER TABLE objectives DROP COLUMN IF EXISTS description;

RAISE NOTICE 'Migration rolled back successfully';
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration 2025-12-01-create-versus-wizard completed successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Review verification queries above';
    RAISE NOTICE '2. Test that existing app still loads (home page, versus detail)';
    RAISE NOTICE '3. Proceed to Phase 1 implementation';
END $$;

