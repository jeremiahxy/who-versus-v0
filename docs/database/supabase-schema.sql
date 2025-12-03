-- Who Versus Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Players Table
-- Links to Supabase auth.users for authentication
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Versus Table
-- Stores game/challenge definitions
CREATE TABLE IF NOT EXISTS versus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type VARCHAR(50), -- Type: 'Scavenger Hunt', 'Fitness Challenge', 'Chore Competition', 'Swear Jar', 'Other'
  reverse_ranking BOOLEAN DEFAULT FALSE NOT NULL, -- If true, lowest score ranks #1 (for penalty-based games)
  created_by UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Versus_Players Table (Join Table)
-- Links players to versus games they're participating in
CREATE TABLE IF NOT EXISTS versus_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  versus_id UUID REFERENCES versus(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  is_commissioner BOOLEAN DEFAULT FALSE NOT NULL,
  nickname VARCHAR(50), -- Optional: Versus-specific nickname override. If NULL, use player's display_name
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(versus_id, player_id)
);

-- Objectives Table
-- Stores objectives/tasks within each versus
CREATE TABLE IF NOT EXISTS objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  versus_id UUID REFERENCES versus(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, -- Objective title (e.g., "Run 5 miles")
  points INTEGER NOT NULL, -- Can be positive or negative (e.g., +10 or -5)
  description TEXT, -- Optional explanation of the objective
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Completions Table
-- Records when players complete objectives
CREATE TABLE IF NOT EXISTS completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  versus_id UUID REFERENCES versus(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  objective_id UUID REFERENCES objectives(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_versus_created_by ON versus(created_by);
CREATE INDEX IF NOT EXISTS idx_versus_players_versus_id ON versus_players(versus_id);
CREATE INDEX IF NOT EXISTS idx_versus_players_player_id ON versus_players(player_id);
CREATE INDEX IF NOT EXISTS idx_objectives_versus_id ON objectives(versus_id);
CREATE INDEX IF NOT EXISTS idx_completions_versus_id ON completions(versus_id);
CREATE INDEX IF NOT EXISTS idx_completions_player_id ON completions(player_id);
CREATE INDEX IF NOT EXISTS idx_completions_objective_id ON completions(objective_id);

-- ============================================================================
-- 3. CREATE AUTO-UPDATE TRIGGER FUNCTION
-- ============================================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_versus_updated_at BEFORE UPDATE ON versus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_versus_players_updated_at BEFORE UPDATE ON versus_players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON objectives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. CREATE VIEWS FOR SCORES AND RANKINGS
-- ============================================================================

-- Player Scores View
-- Aggregates total points per player per versus
CREATE OR REPLACE VIEW player_scores
WITH (security_invoker = true)
AS
SELECT 
  vp.versus_id,
  vp.player_id,
  COALESCE(SUM(o.points), 0) AS total_score
FROM versus_players vp
LEFT JOIN completions c ON c.versus_id = vp.versus_id AND c.player_id = vp.player_id
LEFT JOIN objectives o ON o.id = c.objective_id
GROUP BY vp.versus_id, vp.player_id;

-- Player Rankings View
-- Calculates rank based on scores with support for reverse ranking
CREATE OR REPLACE VIEW player_rankings
WITH (security_invoker = true)
AS
SELECT 
  ps.versus_id,
  ps.player_id,
  ps.total_score,
  CASE 
    WHEN v.reverse_ranking THEN 
      RANK() OVER (PARTITION BY ps.versus_id ORDER BY ps.total_score ASC)
    ELSE 
      RANK() OVER (PARTITION BY ps.versus_id ORDER BY ps.total_score DESC)
  END AS rank,
  COUNT(*) OVER (PARTITION BY ps.versus_id) AS total_players
FROM player_scores ps
JOIN versus v ON v.id = ps.versus_id;

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE versus ENABLE ROW LEVEL SECURITY;
ALTER TABLE versus_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================================

-- Helper function to check if user is in a versus (avoids recursion)
CREATE OR REPLACE FUNCTION is_user_in_versus(versus_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM versus_players
    WHERE versus_id = versus_uuid
    AND player_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is commissioner (avoids recursion)
CREATE OR REPLACE FUNCTION is_user_commissioner(versus_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM versus_players
    WHERE versus_id = versus_uuid
    AND player_id = auth.uid()
    AND is_commissioner = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. CREATE RLS POLICIES
-- ============================================================================

-- Players Policies
-- Users can read all players, but only update their own profile
CREATE POLICY "Players are viewable by everyone"
  ON players FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own player profile"
  ON players FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own player profile"
  ON players FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Versus Policies
-- Users can only see versus they're participating in
CREATE POLICY "Users can view versus they participate in"
  ON versus FOR SELECT
  USING (is_user_in_versus(id));

CREATE POLICY "Users can create versus"
  ON versus FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Commissioners can update their versus"
  ON versus FOR UPDATE
  USING (is_user_commissioner(id));

-- Versus_Players Policies
-- Users can see their own memberships and memberships in versus they participate in
CREATE POLICY "Users can view their own versus_players records"
  ON versus_players FOR SELECT
  USING (
    player_id = auth.uid()
    OR is_user_in_versus(versus_id)
  );

-- Allow versus creators to add players (including themselves) 
-- OR allow commissioners to add additional players
-- Note: Creators need this to add themselves as the first commissioner
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

CREATE POLICY "Commissioners can update versus_players"
  ON versus_players FOR UPDATE
  USING (
    is_user_commissioner(versus_id)
  );

-- Objectives Policies
-- Objectives are readable by all versus participants, editable by commissioners
CREATE POLICY "Users can view objectives for their versus"
  ON objectives FOR SELECT
  USING (is_user_in_versus(versus_id));

CREATE POLICY "Commissioners can create objectives"
  ON objectives FOR INSERT
  WITH CHECK (is_user_commissioner(versus_id));

CREATE POLICY "Commissioners can update objectives"
  ON objectives FOR UPDATE
  USING (is_user_commissioner(versus_id));

CREATE POLICY "Commissioners can delete objectives"
  ON objectives FOR DELETE
  USING (is_user_commissioner(versus_id));

-- Completions Policies
-- Users can create their own completions, view all in their versus
CREATE POLICY "Users can view completions for their versus"
  ON completions FOR SELECT
  USING (is_user_in_versus(versus_id));

CREATE POLICY "Users can create their own completions"
  ON completions FOR INSERT
  WITH CHECK (
    auth.uid() = player_id
    AND is_user_in_versus(versus_id)
  );

CREATE POLICY "Users can delete their own completions"
  ON completions FOR DELETE
  USING (auth.uid() = player_id);

-- ============================================================================
-- 8. CREATE FUNCTION TO AUTO-CREATE PLAYER ON SIGNUP
-- ============================================================================

-- This function automatically creates a player record when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.players (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Add your Supabase credentials to .env.local
-- 2. The database is now ready to use with your application
-- ============================================================================

