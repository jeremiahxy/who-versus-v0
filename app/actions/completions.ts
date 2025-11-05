"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { InsertCompletion } from "@/types/database";

/**
 * Mark an objective as complete
 */
export async function completeObjective(completion: InsertCompletion) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Verify user has access to this versus
  const { error: accessError } = await supabase
    .from("versus_players")
    .select("*")
    .eq("versus_id", completion.versus_id)
    .eq("player_id", user.id)
    .single();

  if (accessError) {
    return {
      data: null,
      error: new Error("You don't have access to this versus"),
    };
  }

  // Ensure the completion is for the current user
  if (completion.player_id !== user.id) {
    return {
      data: null,
      error: new Error("You can only complete objectives for yourself"),
    };
  }

  const { data, error } = await supabase
    .from("completions")
    .insert(completion)
    .select()
    .single();

  if (!error) {
    revalidatePath(`/versus/${completion.versus_id}`);
    revalidatePath("/");
  }

  return { data, error };
}

/**
 * Get completions for a specific player in a versus
 */
export async function getPlayerCompletions(versusId: string, playerId: string) {
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
    return {
      data: null,
      error: new Error("You don't have access to this versus"),
    };
  }

  const { data, error } = await supabase
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
    .eq("player_id", playerId)
    .order("completed_at", { ascending: false });

  return { data, error };
}

/**
 * Delete a completion (undo)
 * Users can only delete their own completions
 */
export async function deleteCompletion(completionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Get completion to verify ownership and get versus_id
  const { data: completion, error: completionError } = await supabase
    .from("completions")
    .select("*")
    .eq("id", completionId)
    .single();

  if (completionError || !completion) {
    return { data: null, error: new Error("Completion not found") };
  }

  // Verify user owns this completion
  if (completion.player_id !== user.id) {
    return {
      data: null,
      error: new Error("You can only delete your own completions"),
    };
  }

  const { error } = await supabase
    .from("completions")
    .delete()
    .eq("id", completionId);

  if (!error) {
    revalidatePath(`/versus/${completion.versus_id}`);
    revalidatePath("/");
  }

  return { data: null, error };
}

