"use server";

/**
 * Mock AI Suggestions for Create Versus Wizard
 * 
 * This file provides mock AI-generated objective suggestions for the Create Versus Wizard.
 * Currently returns hardcoded objectives regardless of input parameters.
 * 
 * Future Enhancement: Replace with real AI integration based on Versus type and context.
 * 
 * See: docs/features/create-versus-wizard-spec.md for full specification
 */

/**
 * Suggested objective data structure returned by the mock AI
 */
export interface SuggestedObjective {
  title: string        // Objective title (e.g., "Run 5 miles")
  points: number       // Point value (always positive, +/- applied in UI)
  isPositive: boolean  // Whether this is a positive or negative objective
  description?: string // Optional explanation of the objective
}

/**
 * Generate objective suggestions (MOCK for MVP)
 * 
 * For MVP, this always returns 4 hardcoded fitness-related objectives regardless of input.
 * The count parameter is accepted for API consistency but currently ignored.
 * 
 * @param count - Number of objectives requested (1-12). Currently ignored, always returns 4.
 * @returns Array of 4 suggested objectives
 * 
 * @example
 * ```typescript
 * const suggestions = await generateObjectiveSuggestions(5);
 * // Returns: 4 objectives (count parameter ignored in MVP)
 * // [
 * //   { title: "Run 5 miles", points: 10, isPositive: true },
 * //   { title: "Do 20 pushups", points: 5, isPositive: true },
 * //   { title: "Attend yoga class", points: 8, isPositive: true },
 * //   { title: "Bike 15 miles", points: 15, isPositive: true }
 * // ]
 * ```
 * 
 * Future Enhancements:
 * - Accept versusType parameter to generate type-specific suggestions
 * - Respect count parameter to return requested number of objectives
 * - Real AI integration using GPT/Claude for context-aware suggestions
 * - Support for negative objectives (Swear Jar type)
 * - Customization based on user's past Versus history
 */
export async function generateObjectiveSuggestions(
  count: number = 4
): Promise<SuggestedObjective[]> {
  
  // Log the request for debugging (helpful for tracking usage)
  console.log(`[Mock AI] Generating ${count} objective suggestions (returning 4 hardcoded)`);

  // Simulate a brief delay to mimic API call (~100-200ms)
  // This makes the UX feel more realistic and tests loading states
  await new Promise(resolve => setTimeout(resolve, 150));

  // Return hardcoded fitness objectives
  // These are always positive objectives with varying point values
  const mockSuggestions: SuggestedObjective[] = [
    {
      title: "Run 5 miles",
      points: 10,
      isPositive: true,
      description: "Complete a 5-mile run (outdoor or treadmill)"
    },
    {
      title: "Do 20 pushups",
      points: 5,
      isPositive: true,
      description: "Perform 20 consecutive pushups with proper form"
    },
    {
      title: "Attend yoga class",
      points: 8,
      isPositive: true,
      description: "Attend a full yoga class (in-person or virtual)"
    },
    {
      title: "Bike 15 miles",
      points: 15,
      isPositive: true,
      description: "Complete a 15-mile bike ride (outdoor or stationary)"
    }
  ];

  return mockSuggestions;
}

/**
 * Generate type-specific objective suggestions (FUTURE)
 * 
 * This function stub represents future AI integration that will generate
 * objectives based on the Versus type selected by the user.
 * 
 * @param versusType - Type of Versus: 'Scavenger Hunt', 'Fitness Challenge', etc.
 * @param count - Number of objectives to generate
 * @returns Array of type-specific suggested objectives
 * 
 * @example
 * ```typescript
 * // Future implementation:
 * const suggestions = await generateTypedObjectiveSuggestions('Swear Jar', 5);
 * // Would return negative objectives like:
 * // [
 * //   { title: "Said a curse word", points: 5, isPositive: false },
 * //   { title: "Interrupted someone", points: 3, isPositive: false },
 * //   ...
 * // ]
 * ```
 * 
 * TODO: Implement in Phase 2 with real AI integration
 */
export async function generateTypedObjectiveSuggestions(
  versusType: string,
  count: number = 4
): Promise<SuggestedObjective[]> {
  // For now, just call the basic mock function
  // This stub allows UI to call this function without errors
  console.log(`[Future Feature] Type-specific suggestions for ${versusType} not yet implemented`);
  return generateObjectiveSuggestions(count);
}

