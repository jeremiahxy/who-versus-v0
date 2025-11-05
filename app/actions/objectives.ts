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

