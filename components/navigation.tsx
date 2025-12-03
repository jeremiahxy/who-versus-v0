import Link from "next/link";
import { Home, Plus } from "lucide-react";
import { LogoutButton } from "./logout-button";

export function Navigation() {
  return (
    <nav className="w-full border-b border-primary/30 bg-card/50 panel-blur">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4 md:max-w-2xl">
        {/* Left Side - Home & Logout */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center justify-center rounded-lg p-2 text-primary transition-all hover:bg-primary/10 hover:neon-glow-subtle"
            aria-label="Home"
          >
            <Home className="h-6 w-6" />
          </Link>
          <LogoutButton />
        </div>

        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-primary neon-text font-display"
        >
          WhoVersus
        </Link>

        {/* Plus Button */}
        <Link
          href="/create"
          className="flex items-center justify-center rounded-lg p-2 text-primary transition-all hover:bg-primary/10 hover:neon-glow-subtle"
          aria-label="Create new versus"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>
    </nav>
  );
}

