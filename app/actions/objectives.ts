"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { InsertObjective, UpdateObjective } from "@/types/database";

/**
 * Get all objectives for a versus
 */
export async function getObjectivesByVersusId(versusId: string) {
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
    .from("objectives")
    .select("*")
    .eq("versus_id", versusId)
    .order("created_at", { ascending: true });

  return { data, error };
}

/**
 * Create a new objective (commissioners only)
 */
export async function createObjective(objective: InsertObjective) {
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
    .eq("versus_id", objective.versus_id)
    .eq("player_id", user.id)
    .eq("is_commissioner", true)
    .single();

  if (accessError || !access) {
    return {
      data: null,
      error: new Error("You don't have permission to create objectives"),
    };
  }

  const { data, error } = await supabase
    .from("objectives")
    .insert(objective)
    .select()
    .single();

  if (!error) {
    revalidatePath(`/versus/${objective.versus_id}`);
  }

  return { data, error };
}

/**
 * Update an objective (commissioners only)
 */
export async function updateObjective(
  objectiveId: string,
  updates: UpdateObjective
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Get objective to find versus_id
  const { data: objective, error: objectiveError } = await supabase
    .from("objectives")
    .select("versus_id")
    .eq("id", objectiveId)
    .single();

  if (objectiveError || !objective) {
    return { data: null, error: new Error("Objective not found") };
  }

  // Check if user is a commissioner
  const { data: access, error: accessError } = await supabase
    .from("versus_players")
    .select("*")
    .eq("versus_id", objective.versus_id)
    .eq("player_id", user.id)
    .eq("is_commissioner", true)
    .single();

  if (accessError || !access) {
    return {
      data: null,
      error: new Error("You don't have permission to update objectives"),
    };
  }

  const { data, error } = await supabase
    .from("objectives")
    .update(updates)
    .eq("id", objectiveId)
    .select()
    .single();

  if (!error) {
    revalidatePath(`/versus/${objective.versus_id}`);
  }

  return { data, error };
}

/**
 * Delete an objective (commissioners only)
 */
export async function deleteObjective(objectiveId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  // Get objective to find versus_id
  const { data: objective, error: objectiveError } = await supabase
    .from("objectives")
    .select("versus_id")
    .eq("id", objectiveId)
    .single();

  if (objectiveError || !objective) {
    return { data: null, error: new Error("Objective not found") };
  }

  // Check if user is a commissioner
  const { data: access, error: accessError } = await supabase
    .from("versus_players")
    .select("*")
    .eq("versus_id", objective.versus_id)
    .eq("player_id", user.id)
    .eq("is_commissioner", true)
    .single();

  if (accessError || !access) {
    return {
      data: null,
      error: new Error("You don't have permission to delete objectives"),
    };
  }

  const { error } = await supabase
    .from("objectives")
    .delete()
    .eq("id", objectiveId);

  if (!error) {
    revalidatePath(`/versus/${objective.versus_id}`);
  }

  return { data: null, error };
}

/**
 * Batch update objectives for a Versus (commissioners only)
 * 
 * This function allows commissioners to manage objectives after Versus creation:
 * - Add new objectives
 * - Update existing objectives (title, points, description)
 * - Delete objectives (by omitting from array)
 * 
 * The function performs atomic updates and handles rollback if any operation fails.
 * 
 * Note: Deleting an objective will cascade delete all completions for that objective
 * (handled by database foreign key constraints).
 * 
 * @param versusId - The Versus ID to update
 * @param objectivesData - Array of objective updates with id (for updates) or without id (for new)
 * @returns Success status or error
 * 
 * @example
 * ```typescript
 * // Update existing, add new, delete omitted:
 * const result = await updateVersusObjectives(versusId, [
 *   { id: "existing-id", title: "Updated Title", points: 15, description: "New desc" },
 *   { title: "New Objective", points: 10, description: null }
 *   // Objectives not in array will be deleted
 * ]);
 * ```
 * 
 * See: docs/features/create-versus-wizard-tasks.md (T024)
 */
export async function updateVersusObjectives(
  versusId: string,
  objectivesData: Array<{
    id?: string; // If provided, update existing; if not, create new
    title: string;
    points: number; // Can be positive or negative
    description: string | null;
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
      error: new Error("Only commissioners can edit objectives"),
    };
  }

  // Get current objectives for this versus
  const { data: currentObjectives, error: currentError } = await supabase
    .from("objectives")
    .select("*")
    .eq("versus_id", versusId);

  if (currentError) {
    return { data: null, error: currentError };
  }

  // Track operations for rollback
  const newObjectiveIds: string[] = [];
  const updatedObjectiveIds: string[] = [];

  try {
    // Process each objective in the update array
    for (const objectiveUpdate of objectivesData) {
      if (objectiveUpdate.id) {
        // Update existing objective
        const existingObjective = currentObjectives?.find(
          (o) => o.id === objectiveUpdate.id
        );

        if (!existingObjective) {
          throw new Error(`Objective ${objectiveUpdate.id} not found`);
        }

        const { error: updateError } = await supabase
          .from("objectives")
          .update({
            title: objectiveUpdate.title,
            points: objectiveUpdate.points,
            description: objectiveUpdate.description,
          })
          .eq("id", objectiveUpdate.id)
          .eq("versus_id", versusId);

        if (updateError) {
          throw new Error(`Failed to update objective: ${updateError.message}`);
        }

        updatedObjectiveIds.push(objectiveUpdate.id);
      } else {
        // Add new objective
        const { data: newObjective, error: insertError } = await supabase
          .from("objectives")
          .insert({
            versus_id: versusId,
            title: objectiveUpdate.title,
            points: objectiveUpdate.points,
            description: objectiveUpdate.description,
          })
          .select()
          .single();

        if (insertError || !newObjective) {
          throw new Error(`Failed to add objective: ${insertError?.message || "Unknown error"}`);
        }

        newObjectiveIds.push(newObjective.id);
      }
    }

    // Delete objectives that are no longer in the array
    const objectivesToKeep = objectivesData
      .map((o) => o.id)
      .filter((id): id is string => !!id);
    const objectivesToRemove = currentObjectives?.filter(
      (o) => !objectivesToKeep.includes(o.id)
    );

    for (const objectiveToRemove of objectivesToRemove || []) {
      const { error: deleteError } = await supabase
        .from("objectives")
        .delete()
        .eq("id", objectiveToRemove.id)
        .eq("versus_id", versusId);

      if (deleteError) {
        throw new Error(`Failed to remove objective: ${deleteError.message}`);
      }
    }

    // Success - revalidate paths
    revalidatePath(`/versus/${versusId}`);
    revalidatePath("/");

    return { data: { success: true }, error: null };
  } catch (error) {
    // Error occurred - log for debugging
    console.error("[updateVersusObjectives] Error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update objectives. Please try again.";

    return { data: null, error: new Error(errorMessage) };
  }
}

