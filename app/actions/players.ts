"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UpdatePlayer } from "@/types/database";

/**
 * Get the current authenticated player
 */
export async function getCurrentPlayer() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  const { data: player, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", user.id)
    .single();

  return { data: player, error };
}

/**
 * Update the current player's profile
 */
export async function updatePlayerProfile(updates: UpdatePlayer) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError || new Error("Not authenticated") };
  }

  const { data, error } = await supabase
    .from("players")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (!error) {
    revalidatePath("/");
  }

  return { data, error };
}

/**
 * Get a player by ID
 */
export async function getPlayerById(playerId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  return { data, error };
}

/**
 * Search for players by email or display name
 */
export async function searchPlayers(query: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .or(`email.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(10);

  return { data, error };
}

