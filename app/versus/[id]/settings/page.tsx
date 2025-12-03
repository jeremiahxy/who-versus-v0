"use client";

/**
 * Edit Settings Page - Manage Settings for a Versus
 * 
 * This page allows commissioners to manage Versus settings after creation:
 * - Update versus name
 * - Change versus type
 * - Toggle reverse ranking
 * 
 * Route: /versus/[id]/settings
 * 
 * Flow:
 * 1. Check if user is commissioner (show error if not)
 * 2. Fetch existing versus data
 * 3. Display settings in edit mode using VersusWizardStep1
 * 4. On submit: Call updateVersusSettings() to save changes
 * 5. Show success toast and redirect to versus detail page
 * 
 * Note: Cannot change number_of_players after creation (just informational display)
 * 
 * See: docs/features/create-versus-wizard-tasks.md (T025)
 */

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VersusWizardStep1, type Step1FormData, type VersusType } from "@/components/versus-wizard-step1";
import { getVersusById, updateVersusSettings } from "@/app/actions/versus";
import { Navigation } from "@/components/navigation";
import Link from "next/link";

export default function EditSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: versusId } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [initialData, setInitialData] = useState<Partial<Step1FormData> | null>(null);

  // ============================================================================
  // Load Data
  // ============================================================================

  useEffect(() => {
    async function loadData() {
      try {
        // Get versus data (includes isCommissioner check)
        const { data: versusData, error: versusError } = await getVersusById(versusId);
        
        if (versusError || !versusData) {
          setError(versusError?.message || "Versus not found");
          setLoading(false);
          return;
        }

        // Check if user is commissioner
        if (!versusData.isCommissioner) {
          setError("Only commissioners can edit settings");
          setIsCommissioner(false);
          setLoading(false);
          return;
        }

        setIsCommissioner(true);

        // Convert versus data to Step1FormData format
        const formData: Partial<Step1FormData> = {
          name: versusData.versus.name,
          type: (versusData.versus.type || "") as VersusType | "",
          reverse_ranking: versusData.versus.reverse_ranking,
          number_of_players: versusData.totalPlayers, // Informational only
          objective_creation: "commissioner", // Not editable in edit mode
        };

        setInitialData(formData);
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
   * Updates versus settings (name, type, reverse_ranking)
   */
  const handleSubmit = async (data: Step1FormData) => {
    setSaving(true);
    setError(null);

    try {
      // Only update editable fields (name, type, reverse_ranking)
      const updates = {
        name: data.name,
        type: data.type || null,
        reverse_ranking: data.reverse_ranking,
      };

      const result = await updateVersusSettings(versusId, updates);

      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }

      // Success! Redirect to versus detail page
      router.push(`/versus/${versusId}`);
    } catch (err) {
      console.error("Error updating settings:", err);
      setError("Failed to save changes. Please try again.");
      setSaving(false);
    }
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

  // Show error if no initial data (shouldn't happen but be safe)
  if (!initialData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="mx-auto w-full max-w-md md:max-w-2xl p-4">
          <div className="text-center py-12">
            <p className="text-destructive">Error: Settings data not found</p>
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
        {/* Info message about number of players */}
        <div className="mb-4 rounded-lg border border-primary/30 bg-card/50 p-4">
          <p className="text-sm text-foreground">
            <strong>Note:</strong> Number of players cannot be changed after creation. This field is for display only.
          </p>
        </div>

        {/* Error message (if saving failed) */}
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Form */}
        <VersusWizardStep1
          mode="edit"
          initialData={initialData}
          onSubmit={handleSubmit}
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

