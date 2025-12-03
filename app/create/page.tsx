/**
 * Create Versus Wizard - Step 1: Settings
 * 
 * This is the first page of the Create Versus Wizard.
 * Users configure basic settings: name, type, reverse ranking, player count, and objective mode.
 * 
 * Route: /create
 * 
 * Flow:
 * 1. Page loads → Fetch current user data
 * 2. User fills form → VersusWizardStep1 handles validation
 * 3. User clicks "Next" → Save to context, navigate to /create/players
 * 4. User clicks "Cancel" → Confirm, redirect to home
 * 
 * See: docs/features/create-versus-wizard-spec.md (T008)
 */

import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/actions/players";
import { Step1Client } from "./step1-client";

/**
 * Server Component - Fetches user data and renders client component
 * 
 * Why a server component wrapper?
 * - We need to fetch the current user from the database
 * - Server components can make authenticated Supabase calls
 * - Client component handles interactivity (form, navigation)
 */
export default async function CreatePage() {
  // Fetch current user data
  // This is used to pre-fill the creator row in Step 2
  const { data: currentPlayer, error } = await getCurrentPlayer();

  // If not authenticated, redirect to login
  if (error || !currentPlayer) {
    redirect("/auth/login?message=Please sign in to create a Versus");
  }

  // Pass user data to client component
  return (
    <Step1Client
      currentUser={{
        id: currentPlayer.id,
        email: currentPlayer.email,
        display_name: currentPlayer.display_name,
      }}
    />
  );
}

