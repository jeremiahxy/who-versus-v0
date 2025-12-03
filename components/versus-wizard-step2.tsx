"use client";

/**
 * Versus Wizard Step 2: Players Form
 * 
 * This component handles adding players to a new Versus.
 * Features email validation, auto-population of display names, and player management.
 * 
 * Key Features:
 * - Creator (Row 1) is pre-filled and locked - cannot be removed
 * - Email validation checks if player exists in the system (on blur)
 * - Display name auto-populates from database when email is found
 * - Optional nickname override for Versus-specific names
 * - Three-dot menu for player actions (currently just Remove)
 * - Player counter showing current vs max players
 * 
 * See: docs/features/create-versus-wizard-spec.md (FR-009 through FR-015)
 */

import { useState, useEffect, useCallback } from "react";
import { validatePlayerEmail } from "@/app/actions/players";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Data for a single player row in the form
 * Each player needs email, display info, and role
 */
export interface PlayerRowData {
  player_id: string;        // UUID from players table (empty until validated)
  email: string;            // Player's email (used for lookup)
  display_name: string;     // Display name from database
  nickname: string;         // Optional Versus-specific nickname
  is_commissioner: boolean; // Can this player manage the Versus?
  isCreator: boolean;       // Is this the Versus creator? (locked row)
  isValidated: boolean;     // Has email been validated against DB?
  isValidating: boolean;    // Currently checking email?
  error: string | null;     // Validation error message
}

/**
 * Component props
 * - mode: "create" for wizard, "edit" for managing existing Versus
 * - initialData: Existing players (for edit mode)
 * - maxPlayers: Maximum number of players allowed (from Step 1)
 * - currentUser: The logged-in user's data (used to pre-fill creator row)
 * - onSubmit: Called with validated player data
 * - onBack: Navigate to previous step
 * - onCancel: Exit the wizard
 */
interface Step2Props {
  mode: "create" | "edit";
  initialData?: PlayerRowData[];
  maxPlayers: number;
  currentUser: {
    id: string;
    email: string;
    display_name: string | null;
  };
  onSubmit: (data: PlayerRowData[]) => void;
  onBack: () => void;
  onCancel: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create an empty player row
 * Used when adding new players or initializing empty slots
 */
const createEmptyPlayerRow = (): PlayerRowData => ({
  player_id: "",
  email: "",
  display_name: "",
  nickname: "",
  is_commissioner: false,
  isCreator: false,
  isValidated: false,
  isValidating: false,
  error: null
});

/**
 * Create the creator's player row (Row 1)
 * This row is always present and cannot be removed
 */
const createCreatorRow = (currentUser: Step2Props["currentUser"]): PlayerRowData => ({
  player_id: currentUser.id,
  email: currentUser.email,
  display_name: currentUser.display_name || currentUser.email.split("@")[0],
  nickname: "",
  is_commissioner: true, // Creator is always a commissioner
  isCreator: true,       // Mark as creator for UI locking
  isValidated: true,     // Creator is already validated
  isValidating: false,
  error: null
});

// ============================================================================
// Component
// ============================================================================

export function VersusWizardStep2({
  mode,
  initialData,
  maxPlayers,
  currentUser,
  onSubmit,
  onBack,
  onCancel
}: Step2Props) {

  // ============================================================================
  // State
  // ============================================================================

  /**
   * Player rows state
   * 
   * In create mode: Starts with just the creator row
   * In edit mode: Uses initialData (existing players)
   * 
   * Users can add rows up to maxPlayers
   */
  const [players, setPlayers] = useState<PlayerRowData[]>(() => {
    if (mode === "edit" && initialData && initialData.length > 0) {
      return initialData;
    }
    // Create mode: Start with just the creator
    return [createCreatorRow(currentUser)];
  });


  // Menu state for three-dot dropdown (tracks which row's menu is open)
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  // ============================================================================
  // Player Management Functions
  // ============================================================================

  /**
   * Add a new player row (FR-012)
   * Only works if under maxPlayers limit
   */
  const addPlayer = () => {
    if (players.length < maxPlayers) {
      setPlayers(prev => [...prev, createEmptyPlayerRow()]);
    }
  };

  /**
   * Remove a player row (FR-011)
   * Cannot remove the creator (index 0)
   */
  const removePlayer = (index: number) => {
    if (index === 0) return; // Cannot remove creator
    setPlayers(prev => prev.filter((_, i) => i !== index));
    setOpenMenuIndex(null); // Close menu
  };

  /**
   * Update a field in a player row
   * Clears errors when email is edited
   */
  const updatePlayer = (
    index: number, 
    field: keyof PlayerRowData, 
    value: string | boolean
  ) => {
    setPlayers(prev => prev.map((player, i) => {
      if (i !== index) return player;
      
      const updated = { ...player, [field]: value };
      
      // If email changed, reset validation state
      if (field === "email") {
        updated.isValidated = false;
        updated.player_id = "";
        updated.display_name = "";
        updated.error = null;
      }
      
      return updated;
    }));
  };

  // ============================================================================
  // Email Validation (FR-010a, FR-010b)
  // ============================================================================

  /**
   * Validate email on blur
   * 
   * This function:
   * 1. Calls the server action to check if email exists
   * 2. If found: Auto-populates player_id and display_name
   * 3. If not found: Shows error message
   * 
   * Why on blur? To provide immediate feedback without API spam during typing
   */
  const validateEmail = useCallback(async (index: number) => {
    const player = players[index];
    
    // Skip if already validated, is creator, or empty
    if (player.isCreator || !player.email || player.isValidated) {
      return;
    }

    // Check for duplicate emails (FR-013)
    const isDuplicate = players.some(
      (p, i) => i !== index && p.email.toLowerCase() === player.email.toLowerCase()
    );
    
    if (isDuplicate) {
      setPlayers(prev => prev.map((p, i) => 
        i === index 
          ? { ...p, error: "Player already invited to this Versus.", isValidating: false }
          : p
      ));
      return;
    }

    // Set validating state (shows loading indicator)
    setPlayers(prev => prev.map((p, i) => 
      i === index ? { ...p, isValidating: true, error: null } : p
    ));

    try {
      // Call server action to validate email
      const result = await validatePlayerEmail(player.email);

      if (result.data) {
        // Email found! Auto-populate player data
        setPlayers(prev => prev.map((p, i) => 
          i === index 
            ? {
                ...p,
                player_id: result.data.id,
                display_name: result.data.display_name || result.data.email.split("@")[0],
                isValidated: true,
                isValidating: false,
                error: null
              }
            : p
        ));
      } else {
        // Email not found - show error
        setPlayers(prev => prev.map((p, i) => 
          i === index 
            ? {
                ...p,
                isValidated: false,
                isValidating: false,
                error: "No account found with this email. Player must sign up first."
              }
            : p
        ));
      }
    } catch {
      // Network or other error
      setPlayers(prev => prev.map((p, i) => 
        i === index 
          ? {
              ...p,
              isValidating: false,
              error: "Failed to validate email. Please try again."
            }
          : p
      ));
    }
  }, [players]);

  // ============================================================================
  // Form Submission
  // ============================================================================

  /**
   * Validate all players and submit if valid
   * 
   * Checks:
   * - At least one player (creator minimum) (FR-014)
   * - All non-empty players are validated
   * - No duplicate emails
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty rows and check for validation issues
    const filledPlayers = players.filter(p => p.email.trim() !== "");
    
    // Check if all filled players are validated
    const invalidPlayers = filledPlayers.filter(p => !p.isValidated);
    if (invalidPlayers.length > 0) {
      // Mark unvalidated players with error
      setPlayers(prev => prev.map(p => {
        if (p.email && !p.isValidated && !p.error) {
          return { ...p, error: "No account found with this email. Player must sign up first." };
        }
        return p;
      }));
      return;
    }

    // Check for any remaining errors
    const hasErrors = filledPlayers.some(p => p.error);
    if (hasErrors) {
      return;
    }

    // Success! Submit only filled and validated players
    onSubmit(filledPlayers);
  };

  // ============================================================================
  // UI Helpers
  // ============================================================================

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuIndex(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Current player count for display
  const currentPlayerCount = players.filter(p => p.email.trim() !== "").length;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary neon-text font-display">
          {mode === "create" ? "Add Players" : "Manage Players"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {mode === "create" 
            ? "Step 2 of 3: Invite players to your challenge" 
            : "Add, remove, or update players"}
        </p>
        {/* Player Counter (FR-012a) */}
        <p className="mt-2 text-sm text-primary">
          Players: {currentPlayerCount} / {maxPlayers} max
        </p>
      </div>

      {/* Player Rows */}
      <div className="space-y-4">
        {players.map((player, index) => (
          <div 
            key={index}
            className={`rounded-lg border p-4 transition-colors ${
              player.isCreator 
                ? "border-primary/50 bg-primary/5" 
                : player.error 
                  ? "border-destructive/50 bg-destructive/5"
                  : "border-primary/20 bg-card/30"
            }`}
          >
            {/* Row Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {player.isCreator ? "You (Commissioner)" : `Player ${index + 1}`}
              </span>
              
              {/* Three-dot Menu (FR-011) */}
              {!player.isCreator && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuIndex(openMenuIndex === index ? null : index);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Player options"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {openMenuIndex === index && (
                    <div className="absolute right-0 mt-1 w-40 rounded-lg border border-primary/30 bg-card shadow-lg z-10">
                      <button
                        type="button"
                        onClick={() => removePlayer(index)}
                        className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        Remove Player
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Player Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email Input (FR-010) */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Email {!player.isCreator && <span className="text-destructive">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id={`email-${index}`}
                    value={player.email}
                    onChange={(e) => updatePlayer(index, "email", e.target.value)}
                    onBlur={() => validateEmail(index)}
                    disabled={player.isCreator}
                    placeholder="player@example.com"
                    aria-label={player.isCreator ? "Your email (cannot be changed)" : `Player ${index + 1} email`}
                    aria-required={!player.isCreator}
                    aria-invalid={!!player.error}
                    aria-describedby={player.error ? `email-${index}-error` : undefined}
                    aria-busy={player.isValidating}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${
                      player.isCreator 
                        ? "border-primary/20 bg-card/30 text-muted-foreground cursor-not-allowed"
                        : "border-primary/30 bg-card/50 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    } placeholder-muted-foreground/50`}
                  />
                  {/* Validation Indicator */}
                  {player.isValidating && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 animate-spin text-primary" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </span>
                  )}
                  {player.isValidated && !player.isCreator && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-green">
                      ✓
                    </span>
                  )}
                </div>
                {player.error && (
                  <p id={`email-${index}-error`} className="mt-1 text-xs text-destructive" role="alert">
                    {player.error}
                  </p>
                )}
              </div>

              {/* Display Name / Nickname (FR-010b, FR-010c) */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {player.isValidated ? "Nickname (optional)" : "Display Name"}
                </label>
                <input
                  type="text"
                  id={`nickname-${index}`}
                  value={player.nickname || player.display_name}
                  onChange={(e) => {
                    // If user edits, store in nickname field
                    if (player.isValidated) {
                      updatePlayer(index, "nickname", e.target.value);
                    }
                  }}
                  disabled={player.isCreator || !player.isValidated}
                  placeholder={player.isValidated ? "Leave blank to use display name" : "Validates after email"}
                  aria-label={player.isValidated ? `Player ${index + 1} nickname (optional)` : `Player ${index + 1} display name`}
                  aria-describedby={player.isValidated ? `nickname-${index}-help` : undefined}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    player.isCreator || !player.isValidated
                      ? "border-primary/20 bg-card/30 text-muted-foreground cursor-not-allowed"
                      : "border-primary/30 bg-card/50 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                  } placeholder-muted-foreground/50`}
                />
                {player.isValidated && !player.isCreator && (
                  <p id={`nickname-${index}-help`} className="mt-1 text-xs text-muted-foreground">
                    DB name: {player.display_name}
                  </p>
                )}
              </div>
            </div>

            {/* Commissioner Checkbox (for non-creators) */}
            {!player.isCreator && player.isValidated && (
              <div className="mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={player.is_commissioner}
                    onChange={(e) => updatePlayer(index, "is_commissioner", e.target.checked)}
                    className="h-4 w-4 rounded border-primary/30 bg-card/50 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">
                    Make Co-Commissioner
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (can edit settings, players, and objectives)
                  </span>
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Player Button (FR-012) */}
      {players.length < maxPlayers && (
        <button
          type="button"
          onClick={addPlayer}
          className="w-full rounded-lg border border-dashed border-primary/30 py-3 text-primary hover:bg-primary/5 transition-colors"
        >
          + Invite Another Player
        </button>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-primary/20">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-primary/30 px-6 py-3 text-foreground hover:bg-card/50 transition-colors"
        >
          ← Back
        </button>

        {/* Cancel Link */}
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>

        {/* Next Button */}
        <button
          type="submit"
          className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:neon-glow-subtle"
        >
          {mode === "create" ? "Next: Add Objectives →" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

