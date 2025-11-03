import { Navigation } from "@/components/navigation";
import { VersusCard } from "@/components/versus-card";

// Mock data for demo purposes
const mockVersusData = [
  {
    id: "1",
    name: "Parent Points",
    score: 10,      // Positive - Lime Green
    rank: 10,       // Bottom 25% (10/12) - Hot Pink
    totalPlayers: 12,
  },
  {
    id: "2",
    name: "Swear Jar",
    score: -50,     // Negative - Hot Pink
    rank: 2,        // Top 25% (2/8) - Lime Green
    totalPlayers: 8,
  },
  {
    id: "3",
    name: "Fitness Challenge",
    score: 0,       // Zero - Electric Blue
    rank: 3,        // Middle 50% (3/5) - Electric Blue
    totalPlayers: 5,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      {/* Main content wrapper with max-width for desktop */}
      <main className="mx-auto w-full max-w-md md:max-w-2xl">
        <div className="flex flex-col gap-4 p-4">
          {/* Page Title - Optional, can be removed if not needed */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-primary font-display">
              My Versus
            </h1>
            <p className="text-sm text-muted-foreground">
              Your active challenges
            </p>
          </div>

          {/* Versus List */}
          <div className="flex flex-col gap-3">
            {mockVersusData.map((versus) => (
              <VersusCard
                key={versus.id}
                id={versus.id}
                name={versus.name}
                score={versus.score}
                rank={versus.rank}
                totalPlayers={versus.totalPlayers}
              />
            ))}
          </div>

          {/* Empty state - shown when no versus exist */}
          {mockVersusData.length === 0 && (
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
