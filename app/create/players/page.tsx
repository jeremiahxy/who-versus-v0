"use client";

/**
 * Create Versus Wizard - Step 2: Players
 * 
 * This page allows users to invite players to their Versus.
 * The creator is automatically added as the first player (commissioner).
 * 
 * Route: /create/players
 * 
 * Flow:
 * 1. Check Step 1 is completed (redirect if not)
 * 2. User adds players by email (validated against database)
 * 3. User clicks "Next" → Save to context, navigate to /create/objectives
 * 4. User clicks "Back" → Navigate to /create (data preserved)
 * 5. User clicks "Cancel" → Confirm, redirect to home
 * 
 * See: docs/features/create-versus-wizard-spec.md (T009)
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VersusWizardStep2, type PlayerRowData } from "@/components/versus-wizard-step2";
import { useWizard } from "../wizard-context";

export default function PlayersPage() {
  const router = useRouter();
  const {
    currentUser,
    playersData,
    setPlayersData,
    getMaxPlayers,
    isStepCompleted,
  } = useWizard();

  // Show cancel confirmation dialog?
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Loading state while checking prerequisites
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================================
  // Check Prerequisites
  // ============================================================================

  /**
   * Verify Step 1 is completed before showing this page
   * If not, redirect back to Step 1
   */
  useEffect(() => {
    // Give context a moment to hydrate
    const timer = setTimeout(() => {
      if (!isStepCompleted(1)) {
        router.replace("/create");
      } else {
        setIsLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isStepCompleted, router]);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle form submission
   * Saves player data to context and navigates to Step 3
   */
  const handleSubmit = (data: PlayerRowData[]) => {
    setPlayersData(data);
    router.push("/create/objectives");
  };

  /**
   * Handle back button
   * Navigates to Step 1 (data is preserved in context)
   */
  const handleBack = () => {
    router.push("/create");
  };

  /**
   * Handle cancel button
   * Shows confirmation dialog
   */
  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  /**
   * Confirm cancel and return to home
   */
  const handleConfirmCancel = () => {
    router.push("/");
  };

  // ============================================================================
  // Render
  // ============================================================================

  // Show loading state while checking prerequisites
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="mx-auto w-8 h-8 animate-spin text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if no current user (shouldn't happen but be safe)
  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error: User data not found</p>
        <button
          onClick={() => router.push("/create")}
          className="mt-4 text-primary hover:underline"
        >
          Go back to Step 1
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Step 2 Form */}
      <VersusWizardStep2
        mode="create"
        initialData={playersData || undefined}
        maxPlayers={getMaxPlayers()}
        currentUser={currentUser}
        onSubmit={handleSubmit}
        onBack={handleBack}
        onCancel={handleCancel}
      />

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-primary/30 bg-card p-6 shadow-lg">
            <h2 className="text-lg font-bold text-foreground font-display">
              Discard Changes?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to cancel? Your progress will not be saved.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 rounded-lg border border-primary/30 py-2 text-foreground hover:bg-card/50 transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 rounded-lg bg-destructive py-2 text-white hover:bg-destructive/90 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

