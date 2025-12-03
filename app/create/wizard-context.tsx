"use client";

/**
 * Wizard Context - State Management for Create Versus Wizard
 * 
 * This context provides shared state across all wizard steps.
 * It stores form data from each step and allows navigation between steps
 * while preserving data.
 * 
 * Why React Context?
 * - Simple to implement and understand
 * - No external dependencies
 * - Persists data across page navigations within the wizard
 * - Clears automatically when user leaves the wizard
 * 
 * Data Flow:
 * 1. Step 1 (Settings) → saves versusData
 * 2. Step 2 (Players) → saves playersData
 * 3. Step 3 (Objectives) → uses all data to call createVersusComplete()
 * 
 * See: docs/features/create-versus-wizard-spec.md
 */

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import type { Step1FormData, ObjectiveCreationMode } from "@/components/versus-wizard-step1";
import type { PlayerRowData } from "@/components/versus-wizard-step2";
import type { ObjectiveSubmitData } from "@/components/versus-wizard-step3";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Current user data (fetched from server, passed to context)
 * Used to pre-fill the creator row in Step 2
 */
export interface WizardCurrentUser {
  id: string;
  email: string;
  display_name: string | null;
}

/**
 * Complete wizard state
 * Stores data from all three steps plus metadata
 */
interface WizardState {
  // Step 1 data
  versusData: Step1FormData | null;
  
  // Step 2 data (validated players)
  playersData: PlayerRowData[] | null;
  
  // Step 3 data (objectives ready for submission)
  objectivesData: ObjectiveSubmitData[] | null;
  
  // Current user (set on wizard load)
  currentUser: WizardCurrentUser | null;
  
  // Track which steps have been completed
  completedSteps: Set<number>;
}

/**
 * Context value - state plus updater functions
 */
interface WizardContextValue extends WizardState {
  // Step 1 updater
  setVersusData: (data: Step1FormData) => void;
  
  // Step 2 updater  
  setPlayersData: (data: PlayerRowData[]) => void;
  
  // Step 3 updater
  setObjectivesData: (data: ObjectiveSubmitData[]) => void;
  
  // Set current user (called on mount)
  setCurrentUser: (user: WizardCurrentUser) => void;
  
  // Mark a step as completed
  markStepCompleted: (step: number) => void;
  
  // Check if a step is completed
  isStepCompleted: (step: number) => boolean;
  
  // Get the number of players from Step 1
  getMaxPlayers: () => number;
  
  // Get the objective creation mode from Step 1
  getObjectiveCreationMode: () => ObjectiveCreationMode;
  
  // Reset all wizard data (for cancel or after success)
  resetWizard: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_STATE: WizardState = {
  versusData: null,
  playersData: null,
  objectivesData: null,
  currentUser: null,
  completedSteps: new Set<number>(),
};

// ============================================================================
// Context Creation
// ============================================================================

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface WizardProviderProps {
  children: ReactNode;
}

/**
 * WizardProvider wraps all /create/* pages
 * Provides shared state and updater functions to all wizard steps
 */
export function WizardProvider({ children }: WizardProviderProps) {
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);

  // ============================================================================
  // Updater Functions
  // ============================================================================

  /**
   * Save Step 1 data and mark step as completed
   */
  const setVersusData = useCallback((data: Step1FormData) => {
    setState(prev => ({
      ...prev,
      versusData: data,
      completedSteps: new Set([...prev.completedSteps, 1]),
    }));
  }, []);

  /**
   * Save Step 2 data and mark step as completed
   */
  const setPlayersData = useCallback((data: PlayerRowData[]) => {
    setState(prev => ({
      ...prev,
      playersData: data,
      completedSteps: new Set([...prev.completedSteps, 2]),
    }));
  }, []);

  /**
   * Save Step 3 data and mark step as completed
   */
  const setObjectivesData = useCallback((data: ObjectiveSubmitData[]) => {
    setState(prev => ({
      ...prev,
      objectivesData: data,
      completedSteps: new Set([...prev.completedSteps, 3]),
    }));
  }, []);

  /**
   * Set the current user (called once on wizard mount)
   */
  const setCurrentUser = useCallback((user: WizardCurrentUser) => {
    setState(prev => ({
      ...prev,
      currentUser: user,
    }));
  }, []);

  /**
   * Mark a step as completed
   */
  const markStepCompleted = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      completedSteps: new Set([...prev.completedSteps, step]),
    }));
  }, []);

  /**
   * Check if a step has been completed
   */
  const isStepCompleted = useCallback((step: number) => {
    return state.completedSteps.has(step);
  }, [state.completedSteps]);

  /**
   * Get max players from Step 1 data
   * Returns 2 (creator + 1) as default if Step 1 not completed
   */
  const getMaxPlayers = useCallback(() => {
    return state.versusData?.number_of_players ?? 2;
  }, [state.versusData]);

  /**
   * Get objective creation mode from Step 1 data
   * Returns "commissioner" as default if Step 1 not completed
   */
  const getObjectiveCreationMode = useCallback((): ObjectiveCreationMode => {
    return state.versusData?.objective_creation ?? "commissioner";
  }, [state.versusData]);

  /**
   * Reset all wizard state
   * Called after successful creation or when user cancels
   */
  const resetWizard = useCallback(() => {
    setState(prev => ({
      ...DEFAULT_STATE,
      // Keep current user since they might start a new wizard
      currentUser: prev.currentUser,
    }));
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: WizardContextValue = {
    ...state,
    setVersusData,
    setPlayersData,
    setObjectivesData,
    setCurrentUser,
    markStepCompleted,
    isStepCompleted,
    getMaxPlayers,
    getObjectiveCreationMode,
    resetWizard,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * useWizard - Hook to access wizard context
 * 
 * Must be used within a WizardProvider (i.e., within /create/* pages)
 * Throws error if used outside provider for early bug detection
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { versusData, setVersusData, getMaxPlayers } = useWizard();
 *   // ... use wizard state and functions
 * }
 * ```
 */
export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);
  
  if (context === undefined) {
    throw new Error(
      "useWizard must be used within a WizardProvider. " +
      "Make sure your component is rendered within /app/create/* routes."
    );
  }
  
  return context;
}

