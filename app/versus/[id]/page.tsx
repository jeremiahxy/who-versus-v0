"use client";

import { use, useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { getScoreColor, getRankColor } from "@/lib/color-utils";
import { ChevronDown, ChevronUp, Menu } from "lucide-react";
import { getVersusById, getPlayerHistoryInVersus } from "@/app/actions/versus";
import type { HistoryEntry } from "@/types/database";

export default function VersusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scoreboardOpen, setScoreboardOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedPlayerHistory, setSelectedPlayerHistory] = useState<HistoryEntry[]>([]);
  const [versusData, setVersusData] = useState<Awaited<ReturnType<typeof getVersusById>>["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await getVersusById(id);
      
      if (error) {
        setError(error.message);
      } else if (data) {
        setVersusData(data);
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [id]);

  useEffect(() => {
    async function fetchPlayerHistory() {
      if (selectedPlayer && versusData) {
        // Find the player ID from the scoreboard
        const player = versusData.scoreboard.find(
          (p) => p.display_name === selectedPlayer
        );
        
        if (player) {
          const { data, error } = await getPlayerHistoryInVersus(id, player.id);
          
          if (data && !error) {
            setSelectedPlayerHistory(data);
          }
        }
      }
    }
    
    fetchPlayerHistory();
  }, [selectedPlayer, id, versusData]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="mx-auto w-full max-w-md md:max-w-2xl p-4">
          <p className="text-center text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (error || !versusData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="mx-auto w-full max-w-md md:max-w-2xl p-4">
          <p className="text-center text-muted-foreground">
            {error || "Versus not found"}
          </p>
        </main>
      </div>
    );
  }

  const scoreColor = getScoreColor(versusData.currentPlayerScore);
  const rankColor = getRankColor(versusData.currentPlayerRank, versusData.totalPlayers);

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      {/* Main content wrapper with max-width for desktop */}
      <main className="mx-auto w-full max-w-md md:max-w-2xl">
        <div className="flex flex-col gap-4 p-4">
          {/* Versus Header with name and menu */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground font-display">
              {versusData.versus.name}
            </h1>
            <button 
              className="rounded-lg p-2 transition-colors hover:bg-muted"
              aria-label="Menu"
            >
              <Menu className="h-6 w-6 text-primary" />
            </button>
          </div>

          {/* YOU label */}
          <div className="text-center">
            <span className="text-lg font-bold text-muted-foreground font-display">
              YOU
            </span>
          </div>

          {/* Score and Rank Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Points Card */}
            <div 
              className="relative overflow-hidden rounded-lg border bg-card/50 p-6 panel-blur"
              style={{ borderColor: `${scoreColor}33` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
              
              <div className="relative flex flex-col items-center justify-center gap-2">
                <span 
                  className="text-6xl font-normal font-score leading-none neon-text"
                  style={{ color: scoreColor }}
                >
                  {versusData.currentPlayerScore}
                </span>
                <span className="text-sm font-bold text-muted-foreground font-display">
                  Points
                </span>
              </div>
            </div>

            {/* Rank Card */}
            <div 
              className="relative overflow-hidden rounded-lg border bg-card/50 p-6 panel-blur"
              style={{ borderColor: `${rankColor}33` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
              
              <div className="relative flex flex-col items-center justify-center gap-2">
                <span 
                  className="text-6xl font-normal font-score leading-none neon-text"
                  style={{ color: rankColor }}
                >
                  {versusData.currentPlayerRank}
                </span>
                <span className="text-sm font-bold text-muted-foreground font-display">
                  of {versusData.totalPlayers}
                </span>
              </div>
            </div>
          </div>

          {/* Scoreboard Section */}
          <div className="overflow-hidden rounded-lg border border-primary/30 bg-card/50 panel-blur">
            <button
              onClick={() => setScoreboardOpen(!scoreboardOpen)}
              className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/20"
            >
              <h2 className="text-xl font-bold text-foreground font-display">
                Scoreboard
              </h2>
              <div className="rounded-full bg-muted p-1.5">
                {scoreboardOpen ? (
                  <ChevronUp className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-primary" />
                )}
              </div>
            </button>

            {scoreboardOpen && (
              <div className="border-t border-primary/30 p-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/20">
                      <th className="pb-2 text-left text-sm font-bold text-muted-foreground font-display">
                        Player
                      </th>
                      <th className="pb-2 text-right text-sm font-bold text-muted-foreground font-display">
                        Score
                      </th>
                      <th className="pb-2 text-right text-sm font-bold text-muted-foreground font-display">
                        Rank
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {versusData.scoreboard.map((player, index: number) => {
                      const playerScoreColor = getScoreColor(player.score);
                      const playerRankColor = getRankColor(player.rank, versusData.totalPlayers);
                      const playerName = player.display_name || player.email.split('@')[0];
                      const isCurrentUser = index === versusData.scoreboard.findIndex((p) => 
                        p.rank === versusData.currentPlayerRank && p.score === versusData.currentPlayerScore
                      );
                      const isClickable = !isCurrentUser;
                      
                      return (
                        <tr 
                          key={player.id} 
                          className={`border-b border-primary/10 last:border-0 ${
                            isCurrentUser ? 'bg-primary/10' : ''
                          }`}
                        >
                          <td className="py-3 text-left font-medium text-foreground">
                            {isClickable ? (
                              <button
                                onClick={() => setSelectedPlayer(playerName)}
                                className="text-left underline decoration-primary/50 hover:decoration-primary transition-colors"
                              >
                                {playerName}
                              </button>
                            ) : (
                              <span className="font-bold">You</span>
                            )}
                          </td>
                          <td 
                            className="py-3 text-right text-2xl font-normal font-score neon-text"
                            style={{ color: playerScoreColor }}
                          >
                            {player.score}
                          </td>
                          <td 
                            className="py-3 text-right text-2xl font-normal font-score neon-text"
                            style={{ color: playerRankColor }}
                          >
                            {player.rank}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* History Section */}
          <div className="overflow-hidden rounded-lg border border-primary/30 bg-card/50 panel-blur">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/20"
            >
              <h2 className="text-xl font-bold text-foreground font-display">
                History
              </h2>
              <div className="rounded-full bg-muted p-1.5">
                {historyOpen ? (
                  <ChevronUp className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-primary" />
                )}
              </div>
            </button>

            {historyOpen && (
              <div className="border-t border-primary/30 p-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/20">
                      <th className="pb-2 text-left text-sm font-bold text-muted-foreground font-display">
                        Date
                      </th>
                      <th className="pb-2 text-left text-sm font-bold text-muted-foreground font-display">
                        Objective
                      </th>
                      <th className="pb-2 text-right text-sm font-bold text-muted-foreground font-display">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {versusData.history.map((entry: HistoryEntry) => {
                      const pointsColor = getScoreColor(entry.points);
                      
                      return (
                        <tr 
                          key={entry.id} 
                          className="border-b border-primary/10 last:border-0"
                        >
                          <td className="py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {entry.date}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {entry.time}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-left font-medium text-foreground">
                            {entry.objective_name}
                          </td>
                          <td 
                            className="py-3 text-right text-xl font-normal font-score neon-text"
                            style={{ color: pointsColor }}
                          >
                            +{entry.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Player History Modal */}
      {selectedPlayer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedPlayer(null)}
        >
          <div 
            className="relative mx-4 w-full max-w-lg overflow-hidden rounded-lg border border-primary/30 bg-card panel-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-primary/30 p-4">
              <h2 className="text-xl font-bold text-foreground font-display">
                {selectedPlayer}&apos;s History
              </h2>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="rounded-lg p-2 transition-colors hover:bg-muted"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="max-h-96 overflow-y-auto p-4">
              {selectedPlayerHistory.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/20">
                      <th className="pb-2 text-left text-sm font-bold text-muted-foreground font-display">
                        Date
                      </th>
                      <th className="pb-2 text-left text-sm font-bold text-muted-foreground font-display">
                        Objective
                      </th>
                      <th className="pb-2 text-right text-sm font-bold text-muted-foreground font-display">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlayerHistory.map((entry) => {
                      const pointsColor = getScoreColor(entry.points);
                      
                      return (
                        <tr 
                          key={entry.id} 
                          className="border-b border-primary/10 last:border-0"
                        >
                          <td className="py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {entry.date}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {entry.time}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-left font-medium text-foreground">
                            {entry.objective_name}
                          </td>
                          <td 
                            className="py-3 text-right text-xl font-normal font-score neon-text"
                            style={{ color: pointsColor }}
                          >
                            +{entry.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No history available for this player
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

