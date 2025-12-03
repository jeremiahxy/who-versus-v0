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

/**
 * Validate if a player exists by email
 * 
 * Used by Create Versus Wizard (Step 2) to validate player invitations.
 * Checks if a player with the given email exists in the system.
 * 
 * This function is called on blur (when user finishes typing email) to:
 * 1. Validate the email exists in the system
 * 2. Auto-populate the player's display_name if found
 * 3. Show error if player doesn't exist (must sign up first)
 * 
 * @param email - Email address to validate
 * @returns Player data if found, null if not found
 * 
 * @example
 * ```typescript
 * // In wizard Step 2, on email input blur:
 * const result = await validatePlayerEmail('john@example.com');
 * 
 * if (result.data) {
 *   // Player exists! Auto-populate display name
 *   setDisplayName(result.data.display_name);
 * } else {
 *   // Player doesn't exist - show error
 *   setError('No account found with this email. Player must sign up first.');
 * }
 * ```
 * 
 * See: docs/features/create-versus-wizard-spec.md (FR-010a, FR-010b)
 */
export async function validatePlayerEmail(email: string) {
  const supabase = await createClient();

  // No authentication check needed - this is a lookup function
  // We want to allow checking if emails exist during wizard flow

  // Validate email format first (basic check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { 
      data: null, 
      error: new Error("Invalid email format") 
    };
  }

  // Look up player by email (case-insensitive)
  const { data, error } = await supabase
    .from("players")
    .select("id, email, display_name")
    .ilike("email", email)
    .single();

  if (error) {
    // Player not found - return null data with descriptive error
    return { 
      data: null, 
      error: new Error("No account found with this email. Player must sign up first.") 
    };
  }

  // Player found! Return their data for auto-population
  return { data, error: null };
}

