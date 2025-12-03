"use client";

/**
 * Edit Players Page - Manage Players for a Versus
 * 
 * This page allows commissioners to manage players after Versus creation:
 * - Add new players
 * - Remove existing players
 * - Update player nicknames
 * - Change commissioner status
 * 
 * Route: /versus/[id]/players
 * 
 * Flow:
 * 1. Check if user is commissioner (show error if not)
 * 2. Fetch existing versus_players data
 * 3. Display players in edit mode using VersusWizardStep2
 * 4. On submit: Call updateVersusPlayers() to save changes
 * 5. Show success toast and redirect to versus detail page
 * 
 * See: docs/features/create-versus-wizard-tasks.md (T017)
 */

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VersusWizardStep2, type PlayerRowData } from "@/components/versus-wizard-step2";
import { getVersusById, getVersusPlayers, updateVersusPlayers } from "@/app/actions/versus";
import { getCurrentPlayer } from "@/app/actions/players";
import { Navigation } from "@/components/navigation";
import Link from "next/link";

export default function EditPlayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: versusId } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    display_name: string | null;
  } | null>(null);
  const [initialPlayers, setInitialPlayers] = useState<PlayerRowData[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(12); // Default max, can be updated from versus

  // ============================================================================
  // Load Data
  // ============================================================================

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const { data: user, error: userError } = await getCurrentPlayer();
        if (userError || !user) {
          setError("Not authenticated. Please log in.");
          setLoading(false);
          return;
        }
        setCurrentUser({
          id: user.id,
          email: user.email,
          display_name: user.display_name,
        });

        // Get versus data (includes isCommissioner check)
        const { data: versusData, error: versusError } = await getVersusById(versusId);
        
        if (versusError || !versusData) {
          setError(versusError?.message || "Versus not found");
          setLoading(false);
          return;
        }

        // Check if user is commissioner
        if (!versusData.isCommissioner) {
          setError("Only commissioners can edit players");
          setIsCommissioner(false);
          setLoading(false);
          return;
        }

        setIsCommissioner(true);

        // Fetch versus_players data with nicknames and commissioner status
        const { data: versusPlayersData, error: playersError } = await getVersusPlayers(versusId);
        
        if (playersError || !versusPlayersData) {
          setError(playersError?.message || "Failed to load players");
          setLoading(false);
          return;
        }

        // Convert versus_players data to PlayerRowData format
        type VersusPlayerWithPlayer = {
          nickname: string | null;
          is_commissioner: boolean;
          player: {
            id: string;
            email: string;
            display_name: string | null;
          };
        };
        
        const players: PlayerRowData[] = (versusPlayersData as VersusPlayerWithPlayer[]).map((vp) => {
          const player = vp.player;
          const isCreator = versusData.versus.created_by === player.id;
          
          return {
            player_id: player.id,
            email: player.email,
            display_name: player.display_name || player.email.split("@")[0],
            nickname: vp.nickname || "",
            is_commissioner: vp.is_commissioner,
            isCreator: isCreator,
            isValidated: true,
            isValidating: false,
            error: null,
          };
        });

        setInitialPlayers(players);
        setMaxPlayers(12); // Default max players (could be fetched from versus if needed)

        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    }

    loadData();
  }, [versusId]);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle form submission
   * Converts PlayerRowData to the format expected by updateVersusPlayers
   */
  const handleSubmit = async (data: PlayerRowData[]) => {
    if (!currentUser) {
      setError("User data not found");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Convert PlayerRowData to updateVersusPlayers format
      const playersUpdate = data.map((player) => ({
        player_id: player.player_id,
        nickname: player.nickname || null,
        is_commissioner: player.is_commissioner,
      }));

      const result = await updateVersusPlayers(versusId, playersUpdate);

      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }

      // Success! Redirect to versus detail page
      router.push(`/versus/${versusId}`);
    } catch (err) {
      console.error("Error updating players:", err);
      setError("Failed to save changes. Please try again.");
      setSaving(false);
    }
  };

  /**
   * Handle back button
   * Returns to versus detail page
   */
  const handleBack = () => {
    router.push(`/versus/${versusId}`);
  };

  /**
   * Handle cancel button
   * Returns to versus detail page without saving
   */
  const handleCancel = () => {
    router.push(`/versus/${versusId}`);
  };

  // ============================================================================
  // Render
  // ============================================================================

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="mx-auto w-full max-w-md md:max-w-2xl p-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="mx-auto w-8 h-8 animate-spin text-primary" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state (non-commissioner or other error)
  if (error && !isCommissioner) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="mx-auto w-full max-w-md md:max-w-2xl p-4">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-destructive font-display mb-4">
              Access Denied
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link
              href={`/versus/${versusId}`}
              className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Back to Versus
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Error state (other errors)
  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="mx-auto w-full max-w-md md:max-w-2xl p-4">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-destructive font-display mb-4">
              Error
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Retry
              </button>
              <Link
                href={`/versus/${versusId}`}
                className="rounded-lg border border-primary/30 px-6 py-3 text-foreground hover:bg-card/50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error if no current user (shouldn't happen but be safe)
  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="mx-auto w-full max-w-md md:max-w-2xl p-4">
          <div className="text-center py-12">
            <p className="text-destructive">Error: User data not found</p>
            <Link
              href={`/versus/${versusId}`}
              className="mt-4 text-primary hover:underline"
            >
              Back to Versus
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Main form
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="mx-auto w-full max-w-md md:max-w-2xl p-4">
        {/* Error message (if saving failed) */}
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Form */}
        <VersusWizardStep2
          mode="edit"
          initialData={initialPlayers}
          maxPlayers={maxPlayers}
          currentUser={currentUser}
          onSubmit={handleSubmit}
          onBack={handleBack}
          onCancel={handleCancel}
        />

        {/* Saving overlay */}
        {saving && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="rounded-lg border border-primary/30 bg-card p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6 animate-spin text-primary" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-foreground">Saving changes...</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

