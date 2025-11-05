"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center rounded-lg p-2 text-primary transition-all hover:bg-primary/10 hover:neon-glow-subtle"
      aria-label="Logout"
      title="Logout"
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
}

