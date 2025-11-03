import Link from "next/link";
import { cn } from "@/lib/utils";
import { getScoreColor, getRankColor } from "@/lib/color-utils";

interface VersusCardProps {
  id: string;
  name: string;
  score: number;
  rank: number;
  totalPlayers: number;
}

export function VersusCard({
  id,
  name,
  score,
  rank,
  totalPlayers,
}: VersusCardProps) {
  const scoreColor = getScoreColor(score);
  const rankColor = getRankColor(rank, totalPlayers);

  return (
    <Link href={`/versus/${id}`}>
      <div className="group relative overflow-hidden rounded-lg border border-primary/30 bg-card/50 p-4 panel-blur transition-all hover:border-primary/60 hover:bg-card/70">
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5" />
        </div>

        <div className="relative flex items-center justify-between gap-4">
          {/* Ranking - moved to left */}
          <div 
            className="flex w-20 flex-col items-center justify-center rounded-lg border bg-muted px-3 py-2"
            style={{ borderColor: `${rankColor}33` }}
          >
            <span className="text-xs text-muted-foreground">Rank</span>
            <span 
              className="text-3xl font-normal font-score leading-none neon-text"
              style={{ color: rankColor }}
            >
              {rank}
            </span>
            <span className="text-xs text-muted-foreground">of {totalPlayers}</span>
          </div>

          {/* Versus Name */}
          <h3 className="flex-1 text-2xl font-bold text-foreground font-display">
            {name}
          </h3>

          {/* Score - stays on right */}
          <span 
            className="text-5xl font-normal font-score leading-none neon-text"
            style={{ color: scoreColor }}
          >
            {score}
          </span>
        </div>
      </div>
    </Link>
  );
}

