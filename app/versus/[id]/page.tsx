"use client";

import { use, useState } from "react";
import { Navigation } from "@/components/navigation";
import { getScoreColor, getRankColor } from "@/lib/color-utils";
import { ChevronDown, ChevronUp, Menu } from "lucide-react";

// Types
type HistoryEntry = {
  date: string;
  time: string;
  objective: string;
  points: number;
};

// Mock data for demo purposes
const mockVersusData = {
  "1": {
    name: "Parent Points",
    currentPlayerScore: 10,
    currentPlayerRank: 2,
    totalPlayers: 2,
    scoreboard: [
      { playerName: "Wife", score: 120, rank: 1 },
      { playerName: "You", score: 10, rank: 2 },
    ],
    history: [
      { date: "11/1/25", time: "12:20pm", objective: "Dishes", points: 5 },
      { date: "11/1/25", time: "12:20pm", objective: "Dishes", points: 5 },
    ],
    playerHistories: {
      "Wife": [
        { date: "11/2/25", time: "3:45pm", objective: "Laundry", points: 10 },
        { date: "11/2/25", time: "8:30am", objective: "Dishes", points: 5 },
        { date: "11/1/25", time: "7:15pm", objective: "Cooking", points: 15 },
      ],
    },
  },
  "2": {
    name: "Swear Jar",
    currentPlayerScore: 150,
    currentPlayerRank: 12,
    totalPlayers: 12,
    scoreboard: [
      { playerName: "Dad", score: 250, rank: 1 },
      { playerName: "Sister", score: 200, rank: 2 },
      { playerName: "Brother", score: 175, rank: 3 },
      { playerName: "You", score: 150, rank: 12 },
    ],
    history: [
      { date: "11/2/25", time: "3:15pm", objective: "Late Pickup", points: 50 },
      { date: "11/1/25", time: "9:30am", objective: "Forgot Snack", points: 25 },
      { date: "10/31/25", time: "6:45pm", objective: "Missed Bedtime", points: 75 },
    ],
    playerHistories: {
      "Dad": [
        { date: "11/2/25", time: "5:20pm", objective: "Late Pickup", points: 50 },
        { date: "11/1/25", time: "2:10pm", objective: "Forgot Permission Slip", points: 25 },
        { date: "10/30/25", time: "9:30pm", objective: "Missed Bedtime", points: 75 },
      ],
      "Sister": [
        { date: "11/2/25", time: "4:15pm", objective: "Forgot Homework", points: 30 },
        { date: "11/1/25", time: "8:45am", objective: "Late to School", points: 40 },
      ],
      "Brother": [
        { date: "11/2/25", time: "7:30pm", objective: "Missed Practice", points: 60 },
        { date: "10/31/25", time: "3:00pm", objective: "Forgot Lunch", points: 20 },
      ],
    },
  },
};

export default function VersusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scoreboardOpen, setScoreboardOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  
  const versus = mockVersusData[id as keyof typeof mockVersusData];

  if (!versus) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="mx-auto w-full max-w-md md:max-w-2xl p-4">
          <p className="text-center text-muted-foreground">Versus not found</p>
        </main>
      </div>
    );
  }

  const scoreColor = getScoreColor(versus.currentPlayerScore);
  const rankColor = getRankColor(versus.currentPlayerRank, versus.totalPlayers);

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      {/* Main content wrapper with max-width for desktop */}
      <main className="mx-auto w-full max-w-md md:max-w-2xl">
        <div className="flex flex-col gap-4 p-4">
          {/* Versus Header with name and menu */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground font-display">
              {versus.name}
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
                  {versus.currentPlayerScore}
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
                  {versus.currentPlayerRank}
                </span>
                <span className="text-sm font-bold text-muted-foreground font-display">
                  of {versus.totalPlayers}
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
                    {versus.scoreboard.map((player, index) => {
                      const playerScoreColor = getScoreColor(player.score);
                      const playerRankColor = getRankColor(player.rank, versus.totalPlayers);
                      const isCurrentUser = player.playerName === "You";
                      const isClickable = !isCurrentUser;
                      
                      return (
                        <tr 
                          key={index} 
                          className={`border-b border-primary/10 last:border-0 ${
                            isCurrentUser ? 'bg-primary/10' : ''
                          }`}
                        >
                          <td className="py-3 text-left font-medium text-foreground">
                            {isClickable ? (
                              <button
                                onClick={() => setSelectedPlayer(player.playerName)}
                                className="text-left underline decoration-primary/50 hover:decoration-primary transition-colors"
                              >
                                {player.playerName}
                              </button>
                            ) : (
                              <span className="font-bold">{player.playerName}</span>
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
                    {versus.history.map((entry, index) => {
                      const pointsColor = getScoreColor(entry.points);
                      
                      return (
                        <tr 
                          key={index} 
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
                            {entry.objective}
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
      {selectedPlayer && (() => {
        const playerHistory = versus.playerHistories?.[selectedPlayer as keyof typeof versus.playerHistories] as HistoryEntry[] | undefined;
        
        return (
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
                {playerHistory ? (
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
                      {playerHistory.map((entry, index) => {
                        const pointsColor = getScoreColor(entry.points);
                        
                        return (
                          <tr 
                            key={index} 
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
                              {entry.objective}
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
        );
      })()}
    </div>
  );
}

