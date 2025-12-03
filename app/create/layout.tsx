/**
 * Layout for Create Versus Wizard
 * 
 * This layout wraps all /create/* routes with the WizardProvider context.
 * This enables state sharing across wizard steps while users navigate
 * between /create, /create/players, and /create/objectives.
 * 
 * Why a layout?
 * - Next.js App Router layouts persist across nested page navigations
 * - The WizardProvider state survives when user goes back/forward between steps
 * - State is automatically cleared when user navigates away from /create/*
 * 
 * See: docs/features/create-versus-wizard-spec.md
 */

import { WizardProvider } from "./wizard-context";

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WizardProvider>
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-lg px-4">
          {children}
        </div>
      </div>
    </WizardProvider>
  );
}

