"use client";

/**
 * Edit Objectives Page - Manage Objectives for a Versus
 * 
 * This page allows commissioners to manage objectives after Versus creation:
 * - Add new objectives
 * - Edit existing objectives (title, points, description)
 * - Delete objectives
 * 
 * Route: /versus/[id]/objectives
 * 
 * Flow:
 * 1. Check if user is commissioner (show error if not)
 * 2. Fetch existing objectives data
 * 3. Display objectives in edit mode using VersusWizardStep3
 * 4. On submit: Call updateVersusObjectives() to save changes
 * 5. Show success toast and redirect to versus detail page
 * 
 * Warning: Changing points will affect existing player scores (scores recalculate automatically)
 * 
 * See: docs/features/create-versus-wizard-tasks.md (T023)
 */

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VersusWizardStep3, type ObjectiveData, type ObjectiveSubmitData } from "@/components/versus-wizard-step3";
import { getObjectivesByVersusId, updateObjective, createObjective, deleteObjective } from "@/app/actions/objectives";
import { getVersusById } from "@/app/actions/versus";
import { Navigation } from "@/components/navigation";
import Link from "next/link";

export default function EditObjectivesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: versusId } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [initialObjectives, setInitialObjectives] = useState<ObjectiveData[]>([]);

  // ============================================================================
  // Load Data
  // ============================================================================

  useEffect(() => {
    async function loadData() {
      try {
        // Check if user is commissioner
        const { data: versusData, error: versusError } = await getVersusById(versusId);
        
        if (versusError || !versusData) {
          setError(versusError?.message || "Versus not found");
          setLoading(false);
          return;
        }

        // Check if user is commissioner
        if (!versusData.isCommissioner) {
          setError("Only commissioners can edit objectives");
          setIsCommissioner(false);
          setLoading(false);
          return;
        }

        setIsCommissioner(true);

        // Fetch objectives data
        const { data: objectivesData, error: objectivesError } = await getObjectivesByVersusId(versusId);
        
        if (objectivesError || !objectivesData) {
          setError(objectivesError?.message || "Failed to load objectives");
          setLoading(false);
          return;
        }

        // Convert objectives to ObjectiveData format for the component
        type ObjectiveFromDB = {
          id: string;
          title: string;
          points: number;
          description: string | null;
        };
        
        const objectives: ObjectiveData[] = (objectivesData as ObjectiveFromDB[]).map((obj) => ({
          id: obj.id,
          title: obj.title,
          points_type: obj.points >= 0 ? "positive" : "negative",
          points: Math.abs(obj.points),
          description: obj.description || "",
          isEditing: false,
        }));

        setInitialObjectives(objectives);
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
   * Handle individual objective save (edit mode)
   * Called immediately when user clicks "Save Objective" on a card
   */
  const handleSaveObjective = async (objective: ObjectiveSubmitData & { id?: string }) => {
    if (objective.id) {
      // Update existing objective
      const result = await updateObjective(objective.id, {
        title: objective.title,
        points: objective.points,
        description: objective.description,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Refresh objectives list
      const { data: objectivesData } = await getObjectivesByVersusId(versusId);
      if (objectivesData) {
        type ObjectiveFromDB = {
          id: string;
          title: string;
          points: number;
          description: string | null;
        };
        
        const updated: ObjectiveData[] = (objectivesData as ObjectiveFromDB[]).map((obj) => ({
          id: obj.id,
          title: obj.title,
          points_type: obj.points >= 0 ? "positive" : "negative",
          points: Math.abs(obj.points),
          description: obj.description || "",
          isEditing: false,
        }));
        setInitialObjectives(updated);
      }
    } else {
      // Create new objective
      const result = await createObjective({
        versus_id: versusId,
        title: objective.title,
        points: objective.points,
        description: objective.description,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Refresh objectives list
      const { data: objectivesData } = await getObjectivesByVersusId(versusId);
      if (objectivesData) {
        type ObjectiveFromDB = {
          id: string;
          title: string;
          points: number;
          description: string | null;
        };
        
        const updated: ObjectiveData[] = (objectivesData as ObjectiveFromDB[]).map((obj) => ({
          id: obj.id,
          title: obj.title,
          points_type: obj.points >= 0 ? "positive" : "negative",
          points: Math.abs(obj.points),
          description: obj.description || "",
          isEditing: false,
        }));
        setInitialObjectives(updated);
      }
    }
  };

  /**
   * Handle individual objective delete (edit mode)
   * Called after user confirms deletion
   */
  const handleDeleteObjective = async (objectiveId: string) => {
    const result = await deleteObjective(objectiveId);

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Refresh objectives list
    const { data: objectivesData } = await getObjectivesByVersusId(versusId);
    if (objectivesData) {
      type ObjectiveFromDB = {
        id: string;
        title: string;
        points: number;
        description: string | null;
      };
      
      const updated: ObjectiveData[] = (objectivesData as ObjectiveFromDB[]).map((obj) => ({
        id: obj.id,
        title: obj.title,
        points_type: obj.points >= 0 ? "positive" : "negative",
        points: Math.abs(obj.points),
        description: obj.description || "",
        isEditing: false,
      }));
      setInitialObjectives(updated);
    }
  };

  /**
   * Handle form submission (create mode only - not used in edit mode)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = async (_data: ObjectiveSubmitData[]) => {
    // This should not be called in edit mode
    // But keeping for compatibility
    setSaving(true);
    setError(null);
    // In edit mode, this won't be called
    setSaving(false);
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
        <VersusWizardStep3
          mode="edit"
          initialData={initialObjectives}
          creationMode="commissioner"
          onSubmit={handleSubmit}
          onBack={handleBack}
          onCancel={handleCancel}
          isSubmitting={saving}
          onSaveObjective={handleSaveObjective}
          onDeleteObjective={handleDeleteObjective}
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

