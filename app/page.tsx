import { Navigation } from "@/components/navigation";
import { VersusCard } from "@/components/versus-card";
import { getUserVersus } from "@/app/actions/versus";
import { redirect } from "next/navigation";

export default async function Home() {
  const { data: versusData, error } = await getUserVersus();

  if (error) {
    console.error("Error fetching versus:", error);
    // If there's an auth error, redirect to login
    if (error.message.includes("authenticated")) {
      redirect("/auth/login");
    }
  }

  const versus = versusData || [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      {/* Main content wrapper with max-width for desktop */}
      <main className="mx-auto w-full max-w-md md:max-w-2xl">
        <div className="flex flex-col gap-4 p-4">
          {/* Page Title */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-primary font-display">
              My Versus
            </h1>
            <p className="text-sm text-muted-foreground">
              Your active challenges
            </p>
          </div>

          {/* Versus List */}
          {versus.length > 0 && (
            <div className="flex flex-col gap-3">
              {versus.map((v) => (
                <VersusCard
                  key={v.id}
                  id={v.id}
                  name={v.name}
                  score={v.current_player_score}
                  rank={v.current_player_rank}
                  totalPlayers={v.total_players}
                  isCommissioner={v.is_commissioner}
                />
              ))}
            </div>
          )}

          {/* Empty state - shown when no versus exist */}
          {versus.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg text-muted-foreground">
                No challenges yet
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first Versus to get started
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
