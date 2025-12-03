"use client";

/**
 * Versus Wizard Step 3: Objectives Form
 * 
 * This component handles creating objectives for the Versus.
 * Supports two modes: Commissioner-defined (manual) or AI-suggested.
 * 
 * Key Features:
 * - Commissioner Mode: Manual creation of objectives with full control
 * - AI Mode: Generate starter objectives that can be edited
 * - Points can be positive (+) or negative (-) for penalty-based games
 * - Maximum 12 objectives per Versus
 * - Description field for additional context
 * 
 * See: docs/features/create-versus-wizard-spec.md (FR-016 through FR-029)
 */

import { useState } from "react";
import { generateObjectiveSuggestions, type SuggestedObjective } from "@/app/actions/suggestions";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Type for positive/negative selection
 * - positive: Points add to score (rewards)
 * - negative: Points subtract from score (penalties)
 */
export type PointsType = "positive" | "negative";

/**
 * Data for a single objective
 * Points are always stored as positive in form, then multiplied by -1 if negative
 */
export interface ObjectiveData {
  id: string;           // Unique ID for React key (UUID or temp ID)
  title: string;        // Objective title (required, 1-100 chars)
  points_type: PointsType;  // Whether points are positive or negative
  points: number;       // Point value (always positive in form)
  description: string;  // Optional explanation
  isEditing: boolean;   // Currently being edited?
}

/**
 * Output data format (what gets saved to database)
 * Points are converted: negative type multiplies points by -1
 */
export interface ObjectiveSubmitData {
  title: string;
  points: number;       // Can be negative
  description: string | null;
}

/**
 * Component props
 * - mode: "create" for wizard, "edit" for managing existing
 * - initialData: Existing objectives (for edit mode)
 * - creationMode: "commissioner" or "ai" (from Step 1)
 * - onSubmit: Called with objectives when creating Versus (create mode only)
 * - onBack: Navigate to previous step
 * - onCancel: Exit the wizard
 * - isSubmitting: Whether form is submitting (create mode only)
 * - onSaveObjective: (edit mode only) Called when saving individual objective (id optional for new)
 * - onDeleteObjective: (edit mode only) Called when deleting individual objective
 */
interface Step3Props {
  mode: "create" | "edit";
  initialData?: ObjectiveData[];
  creationMode: "commissioner" | "ai";
  onSubmit: (data: ObjectiveSubmitData[]) => void;
  onBack: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  onSaveObjective?: (objective: ObjectiveSubmitData & { id?: string }) => Promise<void>;
  onDeleteObjective?: (objectiveId: string) => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_OBJECTIVES = 12;

/**
 * Generate a temporary ID for new objectives
 * Will be replaced with UUID from database after save
 */
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Create an empty objective for the form
 */
const createEmptyObjective = (): ObjectiveData => ({
  id: generateTempId(),
  title: "",
  points_type: "positive",
  points: 10,
  description: "",
  isEditing: true // New objectives start in edit mode
});

// ============================================================================
// Component
// ============================================================================

export function VersusWizardStep3({
  mode,
  initialData,
  creationMode,
  onSubmit,
  onBack,
  onCancel,
  isSubmitting = false,
  onSaveObjective,
  onDeleteObjective
}: Step3Props) {

  // ============================================================================
  // State
  // ============================================================================

  // List of objectives
  const [objectives, setObjectives] = useState<ObjectiveData[]>(
    initialData || []
  );

  // Currently editing objective (for inline form)
  const [editingObjective, setEditingObjective] = useState<ObjectiveData | null>(null);

  // Show the add/edit form?
  const [showForm, setShowForm] = useState(false);

  // AI generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Saving state for individual objectives (edit mode)
  const [savingObjectiveId, setSavingObjectiveId] = useState<string | null>(null);

  // ============================================================================
  // AI Suggestions (FR-022 through FR-029)
  // ============================================================================

  /**
   * Generate AI suggestions
   * 
   * For MVP, this always returns 4 hardcoded fitness objectives.
   * User can edit them after generation.
   */
  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    setErrors({});

    try {
      const suggestions = await generateObjectiveSuggestions(4);
      
      // Convert suggestions to ObjectiveData format
      const newObjectives: ObjectiveData[] = suggestions.map((s: SuggestedObjective) => ({
        id: generateTempId(),
        title: s.title,
        points_type: s.isPositive ? "positive" : "negative",
        points: Math.abs(s.points),
        description: s.description || "",
        isEditing: false
      }));

      setObjectives(newObjectives);
      setHasGenerated(true);
    } catch {
      setErrors({ generate: "Failed to generate suggestions. Please try again." });
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================================
  // Objective Management
  // ============================================================================

  /**
   * Start creating a new objective
   */
  const handleAddObjective = () => {
    if (objectives.length >= MAX_OBJECTIVES) return;
    setEditingObjective(createEmptyObjective());
    setShowForm(true);
    setErrors({});
  };

  /**
   * Start editing an existing objective
   * Sets the objective to editing mode (will expand inline)
   */
  const handleEditObjective = (objective: ObjectiveData) => {
    setEditingObjective({ ...objective, isEditing: true });
    setShowForm(false); // Don't show bottom form for editing existing
    setErrors({});
  };

  /**
   * Request delete confirmation
   */
  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  /**
   * Confirm and delete an objective
   */
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    if (mode === "edit" && onDeleteObjective) {
      // Edit mode: call the delete handler immediately
      setIsDeleting(true);
      try {
        await onDeleteObjective(deleteConfirmId);
        // Remove from local state
        setObjectives(prev => prev.filter(o => o.id !== deleteConfirmId));
      } catch (err) {
        console.error("Error deleting objective:", err);
        setErrors({ delete: "Failed to delete objective. Please try again." });
      } finally {
        setIsDeleting(false);
        setDeleteConfirmId(null);
      }
    } else {
      // Create mode: just remove from local state
      setObjectives(prev => prev.filter(o => o.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  /**
   * Cancel delete confirmation
   */
  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  /**
   * Validate the objective form
   */
  const validateObjective = (obj: ObjectiveData): boolean => {
    const newErrors: Record<string, string> = {};

    if (!obj.title.trim()) {
      newErrors.title = "Title is required";
    } else if (obj.title.length > 100) {
      newErrors.title = "Title must be 100 characters or less";
    }

    if (obj.points < 0 || obj.points > 999999) {
      newErrors.points = "Points must be between 0 and 999,999";
    }

    if (obj.description.length > 500) {
      newErrors.description = "Description must be 500 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Save the currently editing objective
   */
  const handleSaveObjective = async () => {
    if (!editingObjective) return;

    if (!validateObjective(editingObjective)) {
      return;
    }

    const exists = objectives.find(o => o.id === editingObjective.id);

    if (mode === "edit" && onSaveObjective) {
      // Edit mode: save immediately to database (both updates and new)
      setSavingObjectiveId(editingObjective.id);
      try {
        // Convert to submit format
        const submitData: ObjectiveSubmitData & { id?: string } = {
          ...(exists && { id: editingObjective.id }), // Only include id if it's an existing objective
          title: editingObjective.title,
          points: editingObjective.points_type === "negative" 
            ? -Math.abs(editingObjective.points) 
            : Math.abs(editingObjective.points),
          description: editingObjective.description.trim() || null
        };

        await onSaveObjective(submitData);
        
        // Update local state
        if (exists) {
          // Update existing
          setObjectives(prev => prev.map(o => 
            o.id === editingObjective.id 
              ? { ...editingObjective, isEditing: false }
              : o
          ));
        } else {
          // Add new - we need to get the ID from the response
          // For now, just add it and the parent will refresh
          setObjectives(prev => [...prev, { ...editingObjective, isEditing: false }]);
        }

        setEditingObjective(null);
        setShowForm(false);
        setErrors({});
      } catch (err) {
        console.error("Error saving objective:", err);
        setErrors({ save: "Failed to save objective. Please try again." });
      } finally {
        setSavingObjectiveId(null);
      }
    } else {
      // Create mode: just update local state
      setObjectives(prev => {
        if (exists) {
          // Update existing
          return prev.map(o => 
            o.id === editingObjective.id 
              ? { ...editingObjective, isEditing: false }
              : o
          );
        } else {
          // Add new
          return [...prev, { ...editingObjective, isEditing: false }];
        }
      });

      setEditingObjective(null);
      setShowForm(false);
      setErrors({});
    }
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setEditingObjective(null);
    setShowForm(false);
    setErrors({});
  };

  // ============================================================================
  // Form Submission
  // ============================================================================

  /**
   * Handle final form submission
   * Converts objectives to database format and calls onSubmit
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one objective (FR-019)
    if (objectives.length === 0) {
      setErrors({ submit: "At least one objective required" });
      return;
    }

    // Convert to submit format
    // Points calculation (FR-017b, FR-017c): negative type multiplies by -1
    const submitData: ObjectiveSubmitData[] = objectives.map(obj => ({
      title: obj.title,
      points: obj.points_type === "negative" ? -Math.abs(obj.points) : Math.abs(obj.points),
      description: obj.description.trim() || null
    }));

    onSubmit(submitData);
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  /**
   * Format points for display
   * Shows + or - prefix and the value
   */
  const formatPoints = (type: PointsType, points: number): string => {
    const sign = type === "positive" ? "+" : "-";
    return `${sign}${points}`;
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary neon-text font-display">
          {mode === "create" ? "Create Objectives" : "Manage Objectives"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {mode === "create" 
            ? "Step 3 of 3: Define what players need to accomplish" 
            : "Add, edit, or remove objectives"}
        </p>
        <p className="mt-2 text-sm text-primary">
          Objectives: {objectives.length} / {MAX_OBJECTIVES} max
        </p>
      </div>

      {/* AI Mode: Generation Section (FR-022, FR-023) */}
      {creationMode === "ai" && !hasGenerated && (
        <div className="rounded-lg border border-primary/30 bg-card/50 p-6 text-center">
          <h2 className="text-lg font-medium text-foreground mb-2">
            Generate Starter Objectives
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Click below to generate 4 starter objectives. You can edit them or add more after.
          </p>
          
          <button
            type="button"
            onClick={handleGenerateSuggestions}
            disabled={isGenerating}
            className="rounded-lg bg-secondary px-6 py-3 font-bold text-secondary-foreground transition-all hover:bg-secondary/90 hover:neon-glow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              "✨ Generate Objectives"
            )}
          </button>

          {errors.generate && (
            <p className="mt-2 text-sm text-destructive">{errors.generate}</p>
          )}
        </div>
      )}

      {/* Success Message after AI Generation (FR-025) */}
      {creationMode === "ai" && hasGenerated && (
        <div className="rounded-lg border border-neon-green/30 bg-neon-green/5 p-4 text-center">
          <p className="text-sm text-neon-green">
            ✓ Generated 4 starter objectives. You can edit them or add more below.
          </p>
        </div>
      )}

      {/* Objectives List */}
      {objectives.length > 0 && (
        <div className="space-y-3">
          {objectives.map((obj) => {
            const isEditing = editingObjective?.id === obj.id;
            
            return (
              <div
                key={obj.id}
                className={`rounded-lg border ${
                  isEditing ? "border-primary/50 bg-card/50" : "border-primary/20 bg-card/30"
                } p-4 ${isEditing ? "space-y-4" : ""}`}
              >
                {isEditing ? (
                  /* Edit Form Inline */
                  <>
                    <h3 className="text-lg font-medium text-foreground">
                      Edit Objective
                    </h3>

                    {/* Title Input */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Title <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingObjective.title}
                        onChange={(e) => setEditingObjective(prev => prev ? { ...prev, title: e.target.value } : null)}
                        placeholder="e.g., Run 5 miles"
                        maxLength={100}
                        className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-destructive">{errors.title}</p>
                      )}
                    </div>

                    {/* Points Type and Value */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Type <span className="text-destructive">*</span>
                        </label>
                        <select
                          value={editingObjective.points_type}
                          onChange={(e) => setEditingObjective(prev => prev ? { ...prev, points_type: e.target.value as PointsType } : null)}
                          className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                          <option value="positive" className="bg-background">Positive (+)</option>
                          <option value="negative" className="bg-background">Negative (-)</option>
                        </select>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {editingObjective.points_type === "positive" 
                            ? "Adds points when completed" 
                            : "Subtracts points (for penalties)"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Points <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={999999}
                          value={editingObjective.points}
                          onChange={(e) => setEditingObjective(prev => prev ? { ...prev, points: parseInt(e.target.value) || 0 } : null)}
                          className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        {errors.points && (
                          <p className="mt-1 text-sm text-destructive">{errors.points}</p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Description <span className="text-muted-foreground">(optional)</span>
                      </label>
                      <textarea
                        value={editingObjective.description}
                        onChange={(e) => setEditingObjective(prev => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="Add details about this objective..."
                        rows={3}
                        maxLength={500}
                        className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {editingObjective.description.length}/500 characters
                      </p>
                      {errors.description && (
                        <p className="mt-1 text-sm text-destructive">{errors.description}</p>
                      )}
                    </div>

                    {/* Warning about point changes (only in edit mode) */}
                    {mode === "edit" && (
                      <div className="rounded-lg border border-primary/30 bg-card/50 p-3">
                        <p className="text-sm text-foreground">
                          <strong>Note:</strong> Changing points will affect existing player scores. Scores will automatically recalculate.
                        </p>
                      </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveObjective}
                        disabled={savingObjectiveId === editingObjective.id}
                        className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingObjectiveId === editingObjective.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          "Save Objective"
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Normal View */
                  <div className="flex items-center justify-between gap-4">
                    {/* Objective Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {obj.title}
                        </h3>
                        <span 
                          className={`text-sm font-score ${
                            obj.points_type === "positive" ? "text-neon-green" : "text-neon-pink"
                          }`}
                        >
                          {formatPoints(obj.points_type, obj.points)}
                        </span>
                      </div>
                      {obj.description && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {obj.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditObjective(obj)}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Edit objective"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(obj.id)}
                        disabled={isDeleting}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                        aria-label="Delete objective"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Objective Form (FR-017, FR-018) */}
      {/* Only show this form when creating a NEW objective (not editing existing) */}
      {showForm && editingObjective && !objectives.find(o => o.id === editingObjective.id) && (
        <div className="rounded-lg border border-primary/30 bg-card/50 p-6 space-y-4">
          <h3 className="text-lg font-medium text-foreground">
            New Objective
          </h3>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={editingObjective.title}
              onChange={(e) => setEditingObjective(prev => prev ? { ...prev, title: e.target.value } : null)}
              placeholder="e.g., Run 5 miles"
              maxLength={100}
              className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Points Type and Value (FR-017a, FR-017b) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Type <span className="text-destructive">*</span>
              </label>
              <select
                value={editingObjective.points_type}
                onChange={(e) => setEditingObjective(prev => prev ? { ...prev, points_type: e.target.value as PointsType } : null)}
                className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="positive" className="bg-background">Positive (+)</option>
                <option value="negative" className="bg-background">Negative (-)</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                {editingObjective.points_type === "positive" 
                  ? "Adds points when completed" 
                  : "Subtracts points (for penalties)"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Points <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={999999}
                value={editingObjective.points}
                onChange={(e) => setEditingObjective(prev => prev ? { ...prev, points: parseInt(e.target.value) || 0 } : null)}
                className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.points && (
                <p className="mt-1 text-sm text-destructive">{errors.points}</p>
              )}
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={editingObjective.description}
              onChange={(e) => setEditingObjective(prev => prev ? { ...prev, description: e.target.value } : null)}
              placeholder="Add details about this objective..."
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {editingObjective.description.length}/500 characters
            </p>
            {errors.description && (
              <p className="mt-1 text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={savingObjectiveId === editingObjective.id}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveObjective}
              disabled={savingObjectiveId === editingObjective.id}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingObjectiveId === editingObjective.id ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Objective"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Add Objective Button (FR-016, FR-028) */}
      {!showForm && objectives.length < MAX_OBJECTIVES && (
        <button
          type="button"
          onClick={handleAddObjective}
          className="w-full rounded-lg border border-dashed border-primary/30 py-3 text-primary hover:bg-primary/5 transition-colors"
        >
          + Create New Objective
        </button>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>
      )}

      {/* Save/Delete Errors */}
      {(errors.save || errors.delete) && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">{errors.save || errors.delete}</p>
        </div>
      )}

      {/* Form Actions - Only show in create mode */}
      {mode === "create" && (
        <div className="flex items-center justify-between pt-6 border-t border-primary/20">
          {/* Back Button */}
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="rounded-lg border border-primary/30 px-6 py-3 text-foreground hover:bg-card/50 transition-colors disabled:opacity-50"
          >
            ← Back
          </button>

          {/* Cancel Link */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || objectives.length === 0}
            className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:neon-glow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Versus...
              </span>
            ) : (
              "🚀 Create Versus"
            )}
          </button>
        </div>
      )}

      {/* Edit Mode Actions - Just Cancel/Back */}
      {mode === "edit" && (
        <div className="flex items-center justify-between pt-6 border-t border-primary/20">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-primary/30 px-6 py-3 text-foreground hover:bg-card/50 transition-colors"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg border border-primary/30 bg-card p-6 shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-foreground mb-2">
              Delete Objective
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this objective? This action cannot be undone and will remove all completions associated with this objective.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-lg bg-destructive px-4 py-2 font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

