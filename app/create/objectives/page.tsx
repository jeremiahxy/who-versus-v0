"use client";

/**
 * Create Versus Wizard - Step 3: Objectives
 * 
 * This is the final page of the Create Versus Wizard.
 * Users create objectives (manually or via AI suggestions) and submit to create the Versus.
 * 
 * Route: /create/objectives
 * 
 * Flow:
 * 1. Check Steps 1 & 2 are completed (redirect if not)
 * 2. User creates objectives (commissioner mode or AI-assisted)
 * 3. User clicks "Create Versus" → Call createVersusComplete()
 * 4. On success → Show toast, redirect to /versus/[id]
 * 5. On error → Show error, offer retry
 * 6. User clicks "Back" → Navigate to /create/players (data preserved)
 * 7. User clicks "Cancel" → Confirm, redirect to home
 * 
 * See: docs/features/create-versus-wizard-spec.md (T010)
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VersusWizardStep3, type ObjectiveSubmitData } from "@/components/versus-wizard-step3";
import { createVersusComplete } from "@/app/actions/versus";
import { useWizard } from "../wizard-context";

export default function ObjectivesPage() {
  const router = useRouter();
  const {
    versusData,
    playersData,
    objectivesData,
    getObjectiveCreationMode,
    isStepCompleted,
    resetWizard,
  } = useWizard();

  // UI States
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ============================================================================
  // Check Prerequisites
  // ============================================================================

  /**
   * Verify Steps 1 & 2 are completed before showing this page
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isStepCompleted(1)) {
        router.replace("/create");
      } else if (!isStepCompleted(2)) {
        router.replace("/create/players");
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
   * Handle form submission - Create the Versus!
   * 
   * This is the big moment - we take all wizard data and create:
   * 1. The Versus record
   * 2. All player records
   * 3. All objective records
   */
  const handleSubmit = async (objectives: ObjectiveSubmitData[]) => {
    // Safety check - shouldn't happen but be defensive
    if (!versusData || !playersData) {
      setSubmitError("Missing wizard data. Please start over.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare data for createVersusComplete()
      const versusPayload = {
        name: versusData.name,
        type: versusData.type || null,
        reverse_ranking: versusData.reverse_ranking,
      };

      // Convert PlayerRowData to the format expected by the action
      const playersPayload = playersData.map(player => ({
        player_id: player.player_id,
        is_commissioner: player.is_commissioner,
        nickname: player.nickname || null,
      }));

      // Call the server action
      const result = await createVersusComplete(
        versusPayload,
        playersPayload,
        objectives
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (!result.data) {
        throw new Error("No data returned from server");
      }

      // Success! Redirect immediately to the new versus page
      const versusId = result.data.id;
      console.log("[ObjectivesPage] Success! Redirecting to:", `/versus/${versusId}`);
      
      // Navigate first, then clean up
      router.push(`/versus/${versusId}`);
      
      // Reset wizard state after navigation starts
      setTimeout(() => {
        resetWizard();
      }, 100);

    } catch (error) {
      console.error("[ObjectivesPage] Error creating versus:", error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : "Failed to create Versus. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle back button
   * Navigates to Step 2 (data is preserved in context)
   */
  const handleBack = () => {
    router.push("/create/players");
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
    resetWizard();
    router.push("/");
  };

  /**
   * Retry after error
   * Just clears the error so user can try again
   */
  const handleRetry = () => {
    setSubmitError(null);
  };

  // ============================================================================
  // Render
  // ============================================================================

  // Loading state while checking prerequisites
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

  return (
    <>
      {/* Step 3 Form */}
      <VersusWizardStep3
        mode="create"
        initialData={objectivesData ? objectivesData.map((o, i) => ({
          id: `obj-${i}`,
          title: o.title,
          points_type: o.points >= 0 ? "positive" : "negative",
          points: Math.abs(o.points),
          description: o.description || "",
          isEditing: false,
        })) : undefined}
        creationMode={getObjectiveCreationMode()}
        onSubmit={handleSubmit}
        onBack={handleBack}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />

      {/* Error Message with Retry */}
      {submitError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-destructive/50 bg-card p-6 shadow-lg">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-bold text-foreground font-display">
                Failed to Create Versus
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {submitError}
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleConfirmCancel}
                className="flex-1 rounded-lg border border-primary/30 py-2 text-foreground hover:bg-card/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 rounded-lg bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

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

