"use client";

import React, { useEffect } from "react";
import { useGameStore } from "@/lib/game/store";
import { getStreakTier } from "@/lib/game/streak";
import { Volume2, VolumeX, Flame, Globe2, RotateCcw } from "lucide-react";

export default function GameHUD() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const currentRoundIndex = useGameStore((s) => s.currentRoundIndex);
  const rounds = useGameStore((s) => s.rounds);
  const totalScore = useGameStore((s) => s.totalScore);
  const currentStreak = useGameStore((s) => s.currentStreak);
  const playbackState = useGameStore((s) => s.playbackState);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const resetGame = useGameStore((s) => s.resetGame);
  const tickTimer = useGameStore((s) => s.tickTimer);

  const streakTier = getStreakTier(currentStreak);
  const totalRounds = rounds.length || 10;
  const currentRoundNumber = Math.min(totalRounds, currentRoundIndex + 1);

  // Round countdown timer tick
  useEffect(() => {
    if (gameStatus === "playing" || gameStatus === "guessing") {
      const interval = setInterval(() => {
        tickTimer();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStatus, tickTimer]);

  if (gameStatus === "idle" || gameStatus === "loading") {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-4 py-3 sm:px-6 sm:py-4 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand & Quit */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <div className="flex items-center space-x-2 glass-panel px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
            <Globe2 className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span className="font-bold tracking-wider text-sm bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              GEOTUNE
            </span>
          </div>
          <button
            onClick={resetGame}
            title="Exit Game"
            className="p-2 rounded-full glass-panel hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Round Indicator */}
        <div className="glass-panel px-4 py-1.5 rounded-full border border-white/10 shadow-xl pointer-events-auto flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Round
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-base font-bold text-white tabular-nums">
              {currentRoundNumber}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ {totalRounds}</span>
          </div>

          {/* Mini progress dots */}
          <div className="hidden sm:flex items-center space-x-1 ml-2 pl-2 border-l border-white/10">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i < currentRoundIndex
                    ? "bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]"
                    : i === currentRoundIndex
                    ? "bg-white scale-125"
                    : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: Streak & Score & Audio */}
        <div className="flex items-center space-x-2 sm:space-x-3 pointer-events-auto">
          {/* Streak Badge */}
          {currentStreak > 0 && (
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 ${
                streakTier.badgeColor
              } ${currentStreak >= 3 ? "animate-glow-fire" : ""}`}
            >
              <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
              <span className="tabular-nums">{currentStreak} STREAK</span>
              {streakTier.multiplier > 1.0 && (
                <span className="text-[10px] opacity-80 font-mono ml-0.5">
                  ({streakTier.multiplier}x)
                </span>
              )}
            </div>
          )}

          {/* Score Counter */}
          <div className="glass-panel px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg flex items-center space-x-1.5">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider hidden sm:inline">
              Score
            </span>
            <span className="text-sm sm:text-base font-bold text-cyan-300 tabular-nums">
              {totalScore.toLocaleString()}
            </span>
          </div>

          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-full glass-panel hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/5"
            title={playbackState.isMuted ? "Unmute" : "Mute"}
          >
            {playbackState.isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
