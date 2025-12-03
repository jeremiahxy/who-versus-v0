"use client";

/**
 * Versus Wizard Step 1: Settings Form
 * 
 * This component handles the first step of creating a new Versus.
 * Users configure basic settings: name, type, reverse ranking, player count, and objective mode.
 * 
 * Key Features:
 * - Conditional reverse ranking checkbox (only shows for "Swear Jar" and "Other" types)
 * - Dual-purpose component: works for both "create" and "edit" modes
 * - Form validation with helpful error messages
 * 
 * See: docs/features/create-versus-wizard-spec.md (FR-001 through FR-008)
 */

import { useState, useEffect } from "react";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * The five available Versus types
 * These determine the nature of the challenge and affect UI behavior
 */
export const VERSUS_TYPES = [
  "Scavenger Hunt",
  "Fitness Challenge", 
  "Chore Competition",
  "Swear Jar",
  "Other"
] as const;

export type VersusType = typeof VERSUS_TYPES[number];

/**
 * Options for how objectives are created
 * - commissioner: User manually creates all objectives
 * - ai: System suggests objectives (mock for MVP)
 */
export type ObjectiveCreationMode = "commissioner" | "ai";

/**
 * Form data structure for Step 1
 * This gets passed to Step 2 and eventually saved to the database
 */
export interface Step1FormData {
  name: string;
  type: VersusType | "";
  reverse_ranking: boolean;
  number_of_players: number;
  objective_creation: ObjectiveCreationMode;
}

/**
 * Component props
 * - mode: "create" for new Versus wizard, "edit" for updating existing
 * - initialData: Pre-filled values (used in edit mode)
 * - onSubmit: Called when form is valid and user clicks Next/Save
 * - onCancel: Called when user cancels the wizard
 */
interface Step1Props {
  mode: "create" | "edit";
  initialData?: Partial<Step1FormData>;
  onSubmit: (data: Step1FormData) => void;
  onCancel: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default form values for a new Versus
 * Number of players starts at 2 (creator + 1 other)
 */
const DEFAULT_FORM_DATA: Step1FormData = {
  name: "",
  type: "",
  reverse_ranking: false,
  number_of_players: 2,
  objective_creation: "commissioner"
};

// ============================================================================
// Component
// ============================================================================

export function VersusWizardStep1({ 
  mode, 
  initialData, 
  onSubmit, 
  onCancel 
}: Step1Props) {
  
  // Form state - merge initial data with defaults
  const [formData, setFormData] = useState<Step1FormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData
  });

  // Validation errors - key is field name, value is error message
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // Conditional Logic: Reverse Ranking
  // ============================================================================
  
  /**
   * Reverse ranking checkbox visibility logic (FR-003)
   * 
   * Why these types?
   * - "Swear Jar": Penalty-based game where LOWEST score wins (fewer swear words = better)
   * - "Other": Custom type might need reverse ranking
   * - Other types: Typically reward-based where HIGHEST score wins
   */
  const showReverseRanking = formData.type === "Swear Jar" || formData.type === "Other";

  /**
   * Handle type change and set default reverse ranking value (FR-004)
   * 
   * When user changes type:
   * - "Swear Jar" → reverse_ranking defaults to TRUE (penalties)
   * - "Other" → reverse_ranking defaults to FALSE (user's choice)
   * - All other types → reverse_ranking is FALSE and hidden
   * 
   * This is handled in the updateField function for "type" to avoid useEffect cascading renders
   */

  // ============================================================================
  // Form Handlers
  // ============================================================================

  /**
   * Update a single form field
   * Clears any existing error for that field
   * Also handles type change logic for reverse_ranking
   */
  const updateField = <K extends keyof Step1FormData>(
    field: K, 
    value: Step1FormData[K]
  ) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Handle type change logic (FR-004)
      if (field === "type") {
        const newType = value as VersusType | "";
        if (newType === "Swear Jar") {
          updated.reverse_ranking = true;
        } else if (newType === "Other") {
          // Keep existing value for "Other" - don't change it
          // (user might have already set it)
        } else if (newType) {
          // For all other types, reverse ranking is false and hidden
          updated.reverse_ranking = false;
        }
      }
      
      return updated;
    });
    
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Validate all form fields
   * Returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation (FR-001): required, 1-100 characters
    if (!formData.name.trim()) {
      newErrors.name = "Name must be at least 1 character";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must be 100 characters or less";
    }

    // Type validation (FR-002): must select one
    if (!formData.type) {
      newErrors.type = "Please select a Versus type";
    }

    // Number of players validation (FR-005): 1-12
    if (formData.number_of_players < 1 || formData.number_of_players > 12) {
      newErrors.number_of_players = "Number of players must be between 1 and 12";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * Validates and calls onSubmit if valid
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  /**
   * Handle blur on text fields (on-blur validation)
   * Shows errors immediately when user leaves a field
   */
  const handleBlur = () => {
    validateForm();
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary neon-text font-display">
          {mode === "create" ? "Create New Versus" : "Edit Versus Settings"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {mode === "create" 
            ? "Step 1 of 3: Configure your challenge" 
            : "Update your Versus settings"}
        </p>
      </div>

      {/* Versus Name Input (FR-001) */}
      <div>
        <label 
          htmlFor="name" 
          className="block text-sm font-medium text-foreground mb-1"
        >
          Versus Name <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          onBlur={() => handleBlur()}
          placeholder="e.g., Summer Fitness Challenge"
          maxLength={100}
          aria-label="Versus name"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : "name-help"}
          className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-destructive" role="alert">
            {errors.name}
          </p>
        )}
        <p id="name-help" className="mt-1 text-xs text-muted-foreground">
          {formData.name.length}/100 characters
        </p>
      </div>

      {/* Versus Type Dropdown (FR-002) */}
      <div>
        <label 
          htmlFor="type" 
          className="block text-sm font-medium text-foreground mb-1"
        >
          Type <span className="text-destructive">*</span>
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => updateField("type", e.target.value as VersusType | "")}
          aria-label="Versus type"
          aria-required="true"
          aria-invalid={!!errors.type}
          aria-describedby={errors.type ? "type-error" : "type-help"}
          className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="" className="bg-background">Select a type...</option>
          {VERSUS_TYPES.map((type) => (
            <option key={type} value={type} className="bg-background">
              {type}
            </option>
          ))}
        </select>
        {errors.type && (
          <p id="type-error" className="mt-1 text-sm text-destructive" role="alert">
            {errors.type}
          </p>
        )}
        <p id="type-help" className="mt-1 text-xs text-muted-foreground">
          Choose the category that best fits your challenge
        </p>
      </div>

      {/* Reverse Ranking Checkbox - Conditional (FR-003, FR-004) */}
      {showReverseRanking && (
        <div className="rounded-lg border border-primary/20 bg-card/30 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.reverse_ranking}
              onChange={(e) => updateField("reverse_ranking", e.target.checked)}
              aria-label="Reverse ranking"
              aria-describedby="reverse-ranking-help"
              className="mt-1 h-5 w-5 rounded border-primary/30 bg-card/50 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <div>
              <span className="text-foreground font-medium">Reverse Ranking</span>
              <p id="reverse-ranking-help" className="text-sm text-muted-foreground mt-0.5">
                {formData.type === "Swear Jar" 
                  ? "In a Swear Jar, the player with the LOWEST score wins (fewer penalties = better)" 
                  : "Enable this if the player with the LOWEST score should win"}
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Number of Players Input (FR-005) */}
      <div>
        <label 
          htmlFor="number_of_players" 
          className="block text-sm font-medium text-foreground mb-1"
        >
          Number of Players <span className="text-destructive">*</span>
        </label>
        <input
          id="number_of_players"
          type="number"
          min={1}
          max={12}
          value={formData.number_of_players}
          onChange={(e) => updateField("number_of_players", parseInt(e.target.value) || 1)}
          aria-label="Number of players"
          aria-required="true"
          aria-invalid={!!errors.number_of_players}
          aria-describedby={errors.number_of_players ? "number_of_players-error" : "number_of_players-help"}
          className="w-full rounded-lg border border-primary/30 bg-card/50 px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.number_of_players && (
          <p id="number_of_players-error" className="mt-1 text-sm text-destructive" role="alert">
            {errors.number_of_players}
          </p>
        )}
        <p id="number_of_players-help" className="mt-1 text-xs text-muted-foreground">
          This includes you. You can add up to 12 players total.
        </p>
      </div>

      {/* Objective Creation Mode (FR-006) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          How do you want to create objectives? <span className="text-destructive">*</span>
        </label>
        <div className="space-y-3">
          {/* Option 1: Commissioner Defined */}
          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-primary/20 bg-card/30 p-4 hover:bg-card/50 transition-colors">
            <input
              type="radio"
              name="objective_creation"
              value="commissioner"
              checked={formData.objective_creation === "commissioner"}
              onChange={() => updateField("objective_creation", "commissioner")}
              aria-label="Commissioner Defined objectives"
              className="mt-1 h-4 w-4 border-primary/30 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-foreground font-medium">Commissioner Defined</span>
              <p className="text-sm text-muted-foreground mt-0.5">
                You&apos;ll create all the objectives and point values yourself
              </p>
            </div>
          </label>
          
          {/* Option 2: AI Suggested */}
          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-primary/20 bg-card/30 p-4 hover:bg-card/50 transition-colors">
            <input
              type="radio"
              name="objective_creation"
              value="ai"
              checked={formData.objective_creation === "ai"}
              onChange={() => updateField("objective_creation", "ai")}
              aria-label="Have WhoVersus Suggest objectives"
              className="mt-1 h-4 w-4 border-primary/30 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-foreground font-medium">Have WhoVersus Suggest</span>
              <p className="text-sm text-muted-foreground mt-0.5">
                We&apos;ll suggest starter objectives that you can edit
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-primary/20">
        {/* Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>

        {/* Submit Button */}
        <button
          type="submit"
          aria-label={mode === "create" ? "Continue to add players" : "Save versus settings"}
          className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:neon-glow-subtle"
        >
          {mode === "create" ? "Next: Add Players →" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

