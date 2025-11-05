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

  // Get versus where user is a participant
  const { data: versusData, error: versusError } = await supabase
    .from("versus_players")
    .select(
      `
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
  const versusIds = versusData
    .map((vp: any) => vp.versus?.id)
    .filter(Boolean);

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
  const versusWithStats: VersusWithStats[] = versusData
    .filter((vp: any) => vp.versus)
    .map((vp: any) => {
      const versus = vp.versus;
      const ranking = rankings?.find((r) => r.versus_id === versus.id);

      return {
        ...versus,
        current_player_score: ranking?.total_score || 0,
        current_player_rank: ranking?.rank || 0,
        total_players: ranking?.total_players || 1,
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

  const scoreboard: PlayerWithStats[] =
    allRankings?.map((r: any) => ({
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
        name,
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

  const history =
    completions?.map((c: any) => ({
      id: c.id,
      date: new Date(c.completed_at).toLocaleDateString(),
      time: new Date(c.completed_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      objective_name: c.objective.name,
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
        name,
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

  const history =
    completions?.map((c: any) => ({
      id: c.id,
      date: new Date(c.completed_at).toLocaleDateString(),
      time: new Date(c.completed_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      objective_name: c.objective.name,
      points: c.objective.points,
      player_name: c.player.display_name,
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

