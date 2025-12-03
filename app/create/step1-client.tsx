"use client";

/**
 * Step 1 Client Component - Settings Form Wrapper
 * 
 * This client component wraps VersusWizardStep1 and handles:
 * - Initializing the wizard context with current user
 * - Navigation on form submit
 * - Cancel confirmation dialog
 * 
 * Why a separate client component?
 * - Server component (page.tsx) fetches data
 * - Client component handles interactivity (hooks, navigation, context)
 * - Clean separation of concerns
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VersusWizardStep1, type Step1FormData } from "@/components/versus-wizard-step1";
import { useWizard, type WizardCurrentUser } from "./wizard-context";

interface Step1ClientProps {
  currentUser: WizardCurrentUser;
}

export function Step1Client({ currentUser }: Step1ClientProps) {
  const router = useRouter();
  const { 
    versusData, 
    setVersusData, 
    setCurrentUser 
  } = useWizard();

  // Show cancel confirmation dialog?
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // ============================================================================
  // Initialize Context with Current User
  // ============================================================================
  
  /**
   * Set current user in context when page loads
   * This is needed for Step 2 to pre-fill the creator row
   */
  useEffect(() => {
    setCurrentUser(currentUser);
  }, [currentUser, setCurrentUser]);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle form submission
   * Saves data to context and navigates to Step 2
   */
  const handleSubmit = (data: Step1FormData) => {
    setVersusData(data);
    router.push("/create/players");
  };

  /**
   * Handle cancel button click
   * Shows confirmation dialog before leaving wizard
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

  return (
    <>
      {/* Step 1 Form */}
      <VersusWizardStep1
        mode="create"
        initialData={versusData || undefined}
        onSubmit={handleSubmit}
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

