"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { getScoreColor, getRankColor } from "@/lib/color-utils";

interface VersusCardProps {
  id: string;
  name: string;
  score: number;
  rank: number;
  totalPlayers: number;
  isCommissioner?: boolean;
}

export function VersusCard({
  id,
  name,
  score,
  rank,
  totalPlayers,
  isCommissioner = false,
}: VersusCardProps) {
  const router = useRouter();
  const scoreColor = getScoreColor(score);
  const rankColor = getRankColor(rank, totalPlayers);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  // Calculate menu position when opening
  useEffect(() => {
    if (menuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8, // 8px gap (mt-2 = 8px)
        right: window.innerWidth - rect.right, // Distance from right edge
      });
    }
  }, [menuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuButtonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Handle menu item clicks
  const handleMenuClick = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  return (
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

        {/* Versus Name - clickable link */}
        <Link href={`/versus/${id}`} className="flex-1">
          <h3 className="text-2xl font-bold text-foreground font-display hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        {/* Score and Menu */}
        <div className="flex items-center gap-3">
          {/* Score */}
          <span 
            className="text-5xl font-normal font-score leading-none neon-text"
            style={{ color: scoreColor }}
          >
            {score}
          </span>

          {/* Commissioner Menu */}
          {isCommissioner && (
            <>
              <button
                ref={menuButtonRef}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label="Commissioner menu"
              >
                <MoreVertical className="h-5 w-5 text-primary" />
              </button>

              {/* Dropdown Menu - Fixed positioning to escape overflow */}
              {menuOpen && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  
                  {/* Menu - Fixed position calculated from button */}
                  <div
                    ref={menuRef}
                    className="fixed w-48 rounded-lg border border-primary/30 bg-background shadow-lg z-50"
                    style={{
                      top: `${menuPosition.top}px`,
                      right: `${menuPosition.right}px`,
                      backgroundColor: 'var(--background)',
                      opacity: 1,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleMenuClick(`/versus/${id}/settings`)}
                      className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors first:rounded-t-lg"
                    >
                      View Settings
                    </button>
                    <button
                      onClick={() => handleMenuClick(`/versus/${id}/players`)}
                      className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                    >
                      Manage Players
                    </button>
                    <button
                      onClick={() => handleMenuClick(`/versus/${id}/objectives`)}
                      className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors last:rounded-b-lg"
                    >
                      Manage Objectives
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

