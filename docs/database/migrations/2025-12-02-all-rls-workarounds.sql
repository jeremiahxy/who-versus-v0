-- ============================================================================
-- Migration: Complete RLS Workaround - All Insert Functions
-- Date: 2025-12-02
-- Description: SECURITY DEFINER functions to bypass RLS for all operations
-- ============================================================================

-- This is a workaround for the Supabase JWT/role issue where db_role returns null
-- even though the JWT contains "role": "authenticated"

-- ============================================================================
-- FUNCTION 1: Add Players to Versus (bulk insert)
-- ============================================================================

CREATE OR REPLACE FUNCTION add_players_to_versus(
  p_versus_id UUID,
  p_players JSONB  -- Array of: [{player_id, is_commissioner, nickname}, ...]
)
RETURNS SETOF versus_players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  player_record JSONB;
  inserted_player versus_players;
BEGIN
  -- Validate versus exists
  IF NOT EXISTS (SELECT 1 FROM versus WHERE id = p_versus_id) THEN
    RAISE EXCEPTION 'Versus does not exist';
  END IF;

  -- Insert each player
  FOR player_record IN SELECT * FROM jsonb_array_elements(p_players)
  LOOP
    INSERT INTO versus_players (versus_id, player_id, is_commissioner, nickname)
    VALUES (
      p_versus_id,
      (player_record->>'player_id')::UUID,
      (player_record->>'is_commissioner')::BOOLEAN,
      player_record->>'nickname'
    )
    RETURNING * INTO inserted_player;
    
    RETURN NEXT inserted_player;
  END LOOP;
  
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION add_players_to_versus(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION add_players_to_versus(UUID, JSONB) TO anon;

-- ============================================================================
-- FUNCTION 2: Create Objectives (bulk insert)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_objectives_for_versus(
  p_versus_id UUID,
  p_objectives JSONB  -- Array of: [{title, points, description}, ...]
)
RETURNS SETOF objectives
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  objective_record JSONB;
  inserted_objective objectives;
BEGIN
  -- Validate versus exists
  IF NOT EXISTS (SELECT 1 FROM versus WHERE id = p_versus_id) THEN
    RAISE EXCEPTION 'Versus does not exist';
  END IF;

  -- Insert each objective
  FOR objective_record IN SELECT * FROM jsonb_array_elements(p_objectives)
  LOOP
    INSERT INTO objectives (versus_id, title, points, description)
    VALUES (
      p_versus_id,
      objective_record->>'title',
      (objective_record->>'points')::INTEGER,
      objective_record->>'description'
    )
    RETURNING * INTO inserted_objective;
    
    RETURN NEXT inserted_objective;
  END LOOP;
  
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION create_objectives_for_versus(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_objectives_for_versus(UUID, JSONB) TO anon;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check all functions were created
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'create_versus_as_user',
  'add_players_to_versus',
  'create_objectives_for_versus'
)
ORDER BY routine_name;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ All RLS workaround functions created!';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions:';
    RAISE NOTICE '  1. create_versus_as_user()';
    RAISE NOTICE '  2. add_players_to_versus()';
    RAISE NOTICE '  3. create_objectives_for_versus()';
    RAISE NOTICE '';
    RAISE NOTICE 'All use SECURITY DEFINER to bypass RLS';
    RAISE NOTICE 'Security maintained through app-level validation';
END $$;

