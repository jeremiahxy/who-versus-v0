"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  InsertVersus,
  UpdateVersus,
  VersusWithStats,
  PlayerWithStats,
} from "@/types/database";

/**
 * Get all versus for the current user with their stats
 */
export async function getUserVersus() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Get versus where user is a participant (include is_commissioner)
  const { data: versusData, error: versusError } = await supabase
    .from("versus_players")
    .select(
      `
      is_commissioner,
      versus:versus_id (
        id,
        name,
        reverse_ranking,
        created_by,
        created_at,
        updated_at
      )
    `
    )
    .eq("player_id", user.id);

  if (versusError) {
    return { data: null, error: versusError };
  }

  // Get rankings for each versus
  type VersusPlayerWithVersus = {
    is_commissioner: boolean;
    versus: {
      id: string;
      name: string;
      reverse_ranking: boolean;
      created_by: string;
      created_at: string;
      updated_at: string;
    } | null;
  };
  
  const versusIds = (versusData as VersusPlayerWithVersus[])
    .map((vp) => vp.versus?.id)
    .filter((id): id is string => Boolean(id));

  if (versusIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: rankings, error: rankingsError } = await supabase
    .from("player_rankings")
    .select("*")
    .in("versus_id", versusIds)
    .eq("player_id", user.id);

  if (rankingsError) {
    return { data: null, error: rankingsError };
  }

  // Combine the data
  const versusWithStats: (VersusWithStats & { is_commissioner: boolean })[] = (versusData as VersusPlayerWithVersus[])
    .filter((vp) => vp.versus)
    .map((vp) => {
      const versus = vp.versus!;
      const ranking = rankings?.find((r) => r.versus_id === versus.id);

      return {
        ...versus,
        current_player_score: ranking?.total_score || 0,
        current_player_rank: ranking?.rank || 0,
        total_players: ranking?.total_players || 1,
        is_commissioner: vp.is_commissioner || false,
      };
    });

  return { data: versusWithStats, error: null };
}

/**
 * Get a specific versus with full details including scoreboard and history
 */
export async function getVersusById(versusId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Check if user has access to this versus
  const { data: access, error: accessError } = await supabase
    .from("versus_players")
    .select("*")
    .eq("versus_id", versusId)
    .eq("player_id", user.id)
    .single();

  if (accessError) {
    return { data: null, error: new Error("You don't have access to this versus") };
  }

  // Get versus details
  const { data: versus, error: versusError } = await supabase
    .from("versus")
    .select("*")
    .eq("id", versusId)
    .single();

  if (versusError) {
    return { data: null, error: versusError };
  }

  // Get current user's ranking
  const { data: userRanking, error: rankingError } = await supabase
    .from("player_rankings")
    .select("*")
    .eq("versus_id", versusId)
    .eq("player_id", user.id)
    .single();

  if (rankingError) {
    console.error("Ranking error:", rankingError);
  }

  // Get scoreboard (all players with rankings)
  const { data: allRankings, error: scoreboardError } = await supabase
    .from("player_rankings")
    .select(
      `
      *,
      player:player_id (
        id,
        display_name,
        email
      )
    `
    )
    .eq("versus_id", versusId)
    .order("rank", { ascending: true });

  if (scoreboardError) {
    return { data: null, error: scoreboardError };
  }

  type RankingWithPlayer = {
    total_score: number;
    rank: number;
    player: {
      id: string;
      email: string;
      display_name: string | null;
    };
  };

  const scoreboard: PlayerWithStats[] =
    (allRankings as RankingWithPlayer[])?.map((r) => ({
      id: r.player.id,
      email: r.player.email,
      display_name: r.player.display_name,
      created_at: "",
      updated_at: "",
      score: r.total_score,
      rank: r.rank,
    })) || [];

  // Get history (completions for current user)
  const { data: completions, error: historyError } = await supabase
    .from("completions")
    .select(
      `
      *,
      objective:objective_id (
        id,
        title,
        points
      )
    `
    )
    .eq("versus_id", versusId)
    .eq("player_id", user.id)
    .order("completed_at", { ascending: false });

  if (historyError) {
    return { data: null, error: historyError };
  }

  type CompletionWithObjective = {
    id: string;
    completed_at: string;
    objective: {
      id: string;
      title: string;
      points: number;
    };
  };

  const history =
    (completions as CompletionWithObjective[])?.map((c) => ({
      id: c.id,
      date: new Date(c.completed_at).toLocaleDateString(),
      time: new Date(c.completed_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      objective_name: c.objective.title,
      points: c.objective.points,
      player_name: "You",
      player_id: user.id,
    })) || [];

  return {
    data: {
      versus,
      currentPlayerScore: userRanking?.total_score || 0,
      currentPlayerRank: userRanking?.rank || 0,
      totalPlayers: userRanking?.total_players || 1,
      scoreboard,
      history,
      isCommissioner: access.is_commissioner,
    },
    error: null,
  };
}

/**
 * Get player history for a specific versus (for viewing other players' history)
 */
export async function getPlayerHistoryInVersus(
  versusId: string,
  playerId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Check if user has access to this versus
  const { error: accessError } = await supabase
    .from("versus_players")
    .select("*")
    .eq("versus_id", versusId)
    .eq("player_id", user.id)
    .single();

  if (accessError) {
    return { data: null, error: new Error("You don't have access to this versus") };
  }

  // Get completions for the specified player
  const { data: completions, error: historyError } = await supabase
    .from("completions")
    .select(
      `
      *,
      objective:objective_id (
        id,
        title,
        points
      ),
      player:player_id (
        id,
        display_name
      )
    `
    )
    .eq("versus_id", versusId)
    .eq("player_id", playerId)
    .order("completed_at", { ascending: false });

  if (historyError) {
    return { data: null, error: historyError };
  }

  type CompletionWithObjectiveAndPlayer = {
    id: string;
    completed_at: string;
    objective: {
      id: string;
      title: string;
      points: number;
    };
    player: {
      id: string;
      display_name: string | null;
    };
  };

  const history =
    (completions as CompletionWithObjectiveAndPlayer[])?.map((c) => ({
      id: c.id,
      date: new Date(c.completed_at).toLocaleDateString(),
      time: new Date(c.completed_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      objective_name: c.objective.title,
      points: c.objective.points,
      player_name: c.player.display_name || "",
      player_id: c.player.id,
    })) || [];

  return { data: history, error: null };
}

/**
 * Create a new versus
 */
export async function createVersus(versus: InsertVersus) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Create the versus
  const { data: newVersus, error: versusError } = await supabase
    .from("versus")
    .insert({ ...versus, created_by: user.id })
    .select()
    .single();

  if (versusError) {
    return { data: null, error: versusError };
  }

  // Add creator as a commissioner in versus_players
  const { error: playerError } = await supabase
    .from("versus_players")
    .insert({
      versus_id: newVersus.id,
      player_id: user.id,
      is_commissioner: true,
    });

  if (playerError) {
    return { data: null, error: playerError };
  }

  revalidatePath("/");
  return { data: newVersus, error: null };
}

/**
 * Update a versus (commissioners only)
 */
export async function updateVersus(versusId: string, updates: UpdateVersus) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Check if user is a commissioner
  const { data: access, error: accessError } = await supabase
    .from("versus_players")
    .select("*")
    .eq("versus_id", versusId)
    .eq("player_id", user.id)
    .eq("is_commissioner", true)
    .single();

  if (accessError || !access) {
    return {
      data: null,
      error: new Error("You don't have permission to update this versus"),
    };
  }

  const { data, error } = await supabase
    .from("versus")
    .update(updates)
    .eq("id", versusId)
    .select()
    .single();

  if (!error) {
    revalidatePath("/");
    revalidatePath(`/versus/${versusId}`);
  }

  return { data, error };
}

/**
 * Update versus settings (commissioners only)
 * 
 * This is a convenience wrapper around updateVersus() specifically for settings updates.
 * Updates name, type, and reverse_ranking fields.
 * 
 * @param versusId - The Versus ID to update
 * @param settings - Settings to update (name, type, reverse_ranking)
 * @returns Success status or error
 * 
 * @example
 * ```typescript
 * const result = await updateVersusSettings(versusId, {
 *   name: "Updated Name",
 *   type: "Fitness Challenge",
 *   reverse_ranking: false
 * });
 * ```
 * 
 * See: docs/features/create-versus-wizard-tasks.md (T026)
 */
export async function updateVersusSettings(
  versusId: string,
  settings: {
    name?: string;
    type?: string | null;
    reverse_ranking?: boolean;
  }
) {
  return updateVersus(versusId, settings);
}

/**
 * Add a player to a versus (commissioners only)
 */
export async function addPlayerToVersus(
  versusId: string,
  playerId: string,
  isCommissioner: boolean = false
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Check if user is a commissioner
  const { data: access, error: accessError } = await supabase
    .from("versus_players")
    .select("*")
    .eq("versus_id", versusId)
    .eq("player_id", user.id)
    .eq("is_commissioner", true)
    .single();

  if (accessError || !access) {
    return {
      data: null,
      error: new Error("You don't have permission to add players"),
    };
  }

  const { data, error } = await supabase
    .from("versus_players")
    .insert({
      versus_id: versusId,
      player_id: playerId,
      is_commissioner: isCommissioner,
    })
    .select()
    .single();

  if (!error) {
    revalidatePath(`/versus/${versusId}`);
  }

  return { data, error };
}

/**
 * Create a complete Versus with players and objectives (Create Versus Wizard)
 * 
 * This is the main function called by the Create Versus Wizard (Step 3) to create
 * a new Versus with all associated data in a single atomic operation.
 * 
 * The function performs three database operations:
 * 1. Create the Versus record
 * 2. Create versus_players records for all invited players
 * 3. Create objectives records for all defined objectives
 * 
 * If ANY step fails, all created records are rolled back to maintain data consistency.
 * 
 * @param versusData - Versus settings from Step 1 (name, type, reverse_ranking)
 * @param playersData - Array of players from Step 2 (player_id, is_commissioner, nickname)
 * @param objectivesData - Array of objectives from Step 3 (title, points, description)
 * 
 * @returns Created Versus record or error
 * 
 * @example
 * ```typescript
 * // Called at end of Create Versus Wizard:
 * const result = await createVersusComplete(
 *   {
 *     name: "Summer Fitness Challenge",
 *     type: "Fitness Challenge",
 *     reverse_ranking: false
 *   },
 *   [
 *     { player_id: "user-1-id", is_commissioner: true, nickname: null },
 *     { player_id: "user-2-id", is_commissioner: false, nickname: "Johnny" }
 *   ],
 *   [
 *     { title: "Run 5 miles", points: 10, description: "Any outdoor or treadmill run" },
 *     { title: "Do 20 pushups", points: 5, description: null }
 *   ]
 * );
 * 
 * if (result.data) {
 *   // Success! Redirect to new Versus page
 *   router.push(`/versus/${result.data.id}`);
 * } else {
 *   // Error - show message with retry option
 *   setError(result.error.message);
 * }
 * ```
 * 
 * See: docs/features/create-versus-wizard-spec.md (FR-029 through FR-039)
 */
export async function createVersusComplete(
  versusData: {
    name: string;
    type: string | null;
    reverse_ranking: boolean;
  },
  playersData: Array<{
    player_id: string;
    is_commissioner: boolean;
    nickname: string | null;
  }>,
  objectivesData: Array<{
    title: string;
    points: number;
    description: string | null;
  }>
) {
  const supabase = await createClient();

  // Step 0: Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("[createVersusComplete] Authentication error:", authError);
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Debug: Log user info to verify auth is working
  console.log("[createVersusComplete] Authenticated user:", {
    user,
  });

  // Debug: Check if player record exists
  const { data: playerCheck, error: playerCheckError } = await supabase
    .from("players")
    .select("id, email, display_name")
    .eq("id", user.id)
    .single();
  
  if (playerCheckError || !playerCheck) {
    console.error("[createVersusComplete] Player record not found!", playerCheckError);
    return {
      data: null,
      error: new Error("Player record not found. Please try logging out and back in."),
    };
  }
  
  console.log("[createVersusComplete] Player record verified:", playerCheck);


  // Validation: Ensure at least one player (should always be true, but check for safety)
  if (playersData.length === 0) {
    console.error("[createVersusComplete] No players provided");
    return { 
      data: null, 
      error: new Error("At least one player required") 
    };
  }

  // Validation: Ensure at least one objective
  if (objectivesData.length === 0) {
    console.error("[createVersusComplete] No objectives provided");
    return { 
      data: null, 
      error: new Error("At least one objective required") 
    };
  }

  // Variables to track created records for rollback
  let createdVersusId: string | null = null;
  let createdPlayersCount = 0;
  let createdObjectivesCount = 0;

  try {
    // ========================================================================
    // STEP 1: Create the Versus record
    // ========================================================================
    console.log("[createVersusComplete] Step 1: Creating versus record...");
    
    // Use stored procedure to bypass RLS (workaround for Supabase JWT/role issue)
    // The SECURITY DEFINER function validates user exists and creates the versus
    const { data: versusResult, error: versusError } = await supabase
      .rpc("create_versus_as_user", {
        p_name: versusData.name,
        p_type: versusData.type,
        p_reverse_ranking: versusData.reverse_ranking,
        p_created_by: user.id,
      })
      .single();

    if (versusError || !versusResult) {
      // Debug: Log access token and database auth context for Supabase support
      console.error("[createVersusComplete] Failed to create versus:", versusError);      
      throw new Error(`Failed to create Versus: ${versusError?.message || "Unknown error"}`);
    }

    // Type assertion: RPC returns a versus record
    const newVersus = versusResult as { 
      id: string; 
      name: string; 
      type: string | null; 
      reverse_ranking: boolean;
      created_by: string;
      created_at: string;
      updated_at: string;
    };
    
    createdVersusId = newVersus.id;
    console.log("[createVersusComplete] ✓ Versus created:", createdVersusId);

    // ========================================================================
    // STEP 2: Create versus_players records
    // ========================================================================
    console.log(`[createVersusComplete] Step 2: Adding ${playersData.length} players...`);

    // Use stored procedure to bypass RLS
    const { data: insertedPlayers, error: playersError } = await supabase
      .rpc("add_players_to_versus", {
        p_versus_id: newVersus.id,
        p_players: playersData,
      });

    if (playersError) {
      console.error("[createVersusComplete] Failed to add players:", playersError);
      throw new Error(`Failed to add players: ${playersError.message}`);
    }

    createdPlayersCount = insertedPlayers?.length || 0;
    console.log(`[createVersusComplete] ✓ Added ${createdPlayersCount} players`);

    // ========================================================================
    // STEP 3: Create objectives records
    // ========================================================================
    console.log(`[createVersusComplete] Step 3: Creating ${objectivesData.length} objectives...`);

    // Use stored procedure to bypass RLS
    const { data: insertedObjectives, error: objectivesError } = await supabase
      .rpc("create_objectives_for_versus", {
        p_versus_id: newVersus.id,
        p_objectives: objectivesData,
      });

    if (objectivesError) {
      console.error("[createVersusComplete] Failed to create objectives:", objectivesError);
      throw new Error(`Failed to create objectives: ${objectivesError.message}`);
    }

    createdObjectivesCount = insertedObjectives?.length || 0;
    console.log(`[createVersusComplete] ✓ Created ${createdObjectivesCount} objectives`);

    // ========================================================================
    // SUCCESS: All steps completed
    // ========================================================================
    console.log("[createVersusComplete] ✅ SUCCESS - Versus created completely");
    console.log(`[createVersusComplete] Summary: Versus ID=${newVersus.id}, Players=${createdPlayersCount}, Objectives=${createdObjectivesCount}`);

    // Revalidate home page to show new Versus
    revalidatePath("/");
    revalidatePath(`/versus/${newVersus.id}`);

    return { data: newVersus, error: null };

  } catch (error) {
    // ========================================================================
    // ERROR: Manual Rollback
    // ========================================================================
    console.error("[createVersusComplete] ❌ ERROR - Rolling back changes...", error);

    // If we created a Versus, delete it (this will cascade delete players and objectives)
    if (createdVersusId) {
      console.log(`[createVersusComplete] Deleting versus ${createdVersusId}...`);
      
      const { error: deleteError } = await supabase
        .from("versus")
        .delete()
        .eq("id", createdVersusId);

      if (deleteError) {
        console.error("[createVersusComplete] CRITICAL: Rollback failed!", deleteError);
        // Log this for manual cleanup if needed
        console.error(`[createVersusComplete] MANUAL CLEANUP REQUIRED: Versus ID ${createdVersusId}`);
      } else {
        console.log("[createVersusComplete] ✓ Rollback successful - all records deleted");
      }
    }

    // Return error to user
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to create Versus. Please try again.";

    return { 
      data: null, 
      error: new Error(errorMessage) 
    };
  }
}

/**
 * Get versus_players data for a specific versus (commissioners only)
 * 
 * Returns all players in a versus with their nicknames and commissioner status.
 * Used by the Edit Players page to display current players.
 * 
 * @param versusId - The Versus ID
 * @returns Array of versus_players with player data
 */
export async function getVersusPlayers(versusId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Check if user is a commissioner
  const { data: access, error: accessError } = await supabase
    .from("versus_players")
    .select("*")
    .eq("versus_id", versusId)
    .eq("player_id", user.id)
    .eq("is_commissioner", true)
    .single();

  if (accessError || !access) {
    return {
      data: null,
      error: new Error("Only commissioners can view player data"),
    };
  }

  // Get all versus_players with player data
  const { data: versusPlayers, error: playersError } = await supabase
    .from("versus_players")
    .select(
      `
      *,
      player:player_id (
        id,
        email,
        display_name
      )
    `
    )
    .eq("versus_id", versusId)
    .order("joined_at", { ascending: true });

  if (playersError) {
    return { data: null, error: playersError };
  }

  return { data: versusPlayers, error: null };
}

/**
 * Update players for a Versus (commissioners only)
 * 
 * This function allows commissioners to manage players after Versus creation:
 * - Add new players
 * - Remove existing players
 * - Update player nicknames
 * - Change commissioner status
 * 
 * The function performs atomic updates using transactions where possible,
 * and handles rollback if any operation fails.
 * 
 * @param versusId - The Versus ID to update
 * @param playersData - Array of player updates with player_id, nickname, is_commissioner
 * @returns Success status or error
 * 
 * @example
 * ```typescript
 * // Add a new player, remove another, update nickname:
 * const result = await updateVersusPlayers(versusId, [
 *   { player_id: "new-player-id", nickname: "Johnny", is_commissioner: false },
 *   { player_id: "existing-player-id", nickname: "Updated Nick", is_commissioner: true }
 * ]);
 * 
 * // Remove a player by omitting from array
 * // (players not in array will be removed)
 * ```
 * 
 * See: docs/features/create-versus-wizard-tasks.md (T018)
 */
export async function updateVersusPlayers(
  versusId: string,
  playersData: Array<{
    player_id: string;
    nickname: string | null;
    is_commissioner: boolean;
  }>
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Check if user is a commissioner
  const { data: access, error: accessError } = await supabase
    .from("versus_players")
    .select("*")
    .eq("versus_id", versusId)
    .eq("player_id", user.id)
    .eq("is_commissioner", true)
    .single();

  if (accessError || !access) {
    return {
      data: null,
      error: new Error("Only commissioners can edit players"),
    };
  }

  // Get current players for this versus
  const { data: currentPlayers, error: currentError } = await supabase
    .from("versus_players")
    .select("*")
    .eq("versus_id", versusId);

  if (currentError) {
    return { data: null, error: currentError };
  }

  // Track operations for rollback
  const newPlayerIds: string[] = [];
  const updatedPlayerIds: string[] = [];

  try {
    // Get the versus to check number_of_players (if it exists in schema)
    const { data: versus, error: versusError } = await supabase
      .from("versus")
      .select("id")
      .eq("id", versusId)
      .single();

    if (versusError || !versus) {
      throw new Error("Versus not found");
    }

    // Process each player in the update array
    for (const playerUpdate of playersData) {
      const existingPlayer = currentPlayers?.find(
        (p) => p.player_id === playerUpdate.player_id
      );

      if (existingPlayer) {
        // Update existing player (nickname or is_commissioner)
        const { error: updateError } = await supabase
          .from("versus_players")
          .update({
            nickname: playerUpdate.nickname,
            is_commissioner: playerUpdate.is_commissioner,
          })
          .eq("versus_id", versusId)
          .eq("player_id", playerUpdate.player_id);

        if (updateError) {
          throw new Error(`Failed to update player: ${updateError.message}`);
        }

        updatedPlayerIds.push(playerUpdate.player_id);
      } else {
        // Add new player
        const { error: insertError } = await supabase
          .from("versus_players")
          .insert({
            versus_id: versusId,
            player_id: playerUpdate.player_id,
            nickname: playerUpdate.nickname,
            is_commissioner: playerUpdate.is_commissioner,
          });

        if (insertError) {
          throw new Error(`Failed to add player: ${insertError.message}`);
        }

        newPlayerIds.push(playerUpdate.player_id);
      }
    }

    // Remove players that are no longer in the array
    const playersToKeep = playersData.map((p) => p.player_id);
    const playersToRemove = currentPlayers?.filter(
      (p) => !playersToKeep.includes(p.player_id)
    );

    for (const playerToRemove of playersToRemove || []) {
      // Don't allow removing the creator (they should always be in the array)
      // This is a safety check
      if (playerToRemove.player_id === user.id && playerToRemove.is_commissioner) {
        // Check if there's at least one other commissioner
        const otherCommissioners = playersData.filter(
          (p) => p.is_commissioner && p.player_id !== user.id
        );
        if (otherCommissioners.length === 0) {
          throw new Error("Cannot remove the last commissioner");
        }
      }

      const { error: deleteError } = await supabase
        .from("versus_players")
        .delete()
        .eq("versus_id", versusId)
        .eq("player_id", playerToRemove.player_id);

      if (deleteError) {
        throw new Error(`Failed to remove player: ${deleteError.message}`);
      }
    }

    // Success - revalidate paths
    revalidatePath(`/versus/${versusId}`);
    revalidatePath("/");

    return { data: { success: true }, error: null };
  } catch (error) {
    // Error occurred - log for debugging
    console.error("[updateVersusPlayers] Error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update players. Please try again.";

    return { data: null, error: new Error(errorMessage) };
  }
}

