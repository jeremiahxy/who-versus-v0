/**
 * Database Types for Who Versus
 * These types match the Supabase database schema
 */

// ============================================================================
// Table Types
// ============================================================================

export interface Player {
  id: string // UUID from auth.users
  email: string
  display_name: string | null
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

export interface Versus {
  id: string // UUID
  name: string
  type: string | null // Type: 'Scavenger Hunt', 'Fitness Challenge', 'Chore Competition', 'Swear Jar', 'Other'
  reverse_ranking: boolean // If true, lowest score ranks #1
  created_by: string // UUID referencing players
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

export interface VersusPlayer {
  id: string // UUID
  versus_id: string // UUID referencing versus
  player_id: string // UUID referencing players
  is_commissioner: boolean
  nickname: string | null // Optional: Versus-specific nickname. If null, use player's display_name
  joined_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

export interface Objective {
  id: string // UUID
  versus_id: string // UUID referencing versus
  title: string // Objective title (e.g., "Run 5 miles")
  points: number // Can be positive or negative (e.g., +10 or -5)
  description: string | null // Optional explanation of the objective
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

export interface Completion {
  id: string // UUID
  versus_id: string // UUID referencing versus
  player_id: string // UUID referencing players
  objective_id: string // UUID referencing objectives
  completed_at: string // ISO timestamp
}

// ============================================================================
// View Types
// ============================================================================

export interface PlayerScore {
  versus_id: string // UUID
  player_id: string // UUID
  total_score: number
}

export interface PlayerRanking {
  versus_id: string // UUID
  player_id: string // UUID
  total_score: number
  rank: number
  total_players: number
}

// ============================================================================
// Extended/Joined Types for Application Use
// ============================================================================

/**
 * Versus with creator information
 */
export interface VersusWithCreator extends Versus {
  creator: Player
}

/**
 * Versus with player information and current user's stats
 */
export interface VersusWithStats extends Versus {
  current_player_score: number
  current_player_rank: number
  total_players: number
}

/**
 * Player with their score and rank in a specific versus
 */
export interface PlayerWithStats extends Player {
  score: number
  rank: number
}

/**
 * Objective with completion status for current user
 */
export interface ObjectiveWithStatus extends Objective {
  completed_by_user: boolean
  completion_count: number
}

/**
 * Completion with full details (objective info, player info)
 */
export interface CompletionWithDetails extends Completion {
  objective: Objective
  player: Player
}

/**
 * History entry for display (combines completion with objective)
 */
export interface HistoryEntry {
  id: string
  date: string
  time: string
  objective_name: string
  points: number
  player_name: string
  player_id: string
}

// ============================================================================
// Database Response Types
// ============================================================================

/**
 * Generic database response type
 */
export type DbResult<T> = 
  | { data: T; error: null }
  | { data: null; error: Error }

/**
 * Insert types (without auto-generated fields)
 */
export type InsertPlayer = Omit<Player, 'created_at' | 'updated_at'>
export type InsertVersus = Omit<Versus, 'id' | 'created_at' | 'updated_at'>
export type InsertVersusPlayer = Omit<VersusPlayer, 'id' | 'joined_at' | 'updated_at'>
export type InsertObjective = Omit<Objective, 'id' | 'created_at' | 'updated_at'>
export type InsertCompletion = Omit<Completion, 'id' | 'completed_at'>

/**
 * Update types (only updateable fields)
 */
export type UpdatePlayer = Partial<Pick<Player, 'display_name'>>
export type UpdateVersus = Partial<Pick<Versus, 'name' | 'type' | 'reverse_ranking'>>
export type UpdateVersusPlayer = Partial<Pick<VersusPlayer, 'is_commissioner' | 'nickname'>>
export type UpdateObjective = Partial<Pick<Objective, 'title' | 'points' | 'description'>>

