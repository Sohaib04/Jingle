"use client";

import React, { useEffect } from "react";
import { useGameStore } from "@/lib/game/store";
import { getStreakTier } from "@/lib/game/streak";
import { Volume2, Volume1, VolumeX, Flame, RotateCcw } from "lucide-react";

export default function GameHUD() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const currentRoundIndex = useGameStore((s) => s.currentRoundIndex);
  const rounds = useGameStore((s) => s.rounds);
  const totalScore = useGameStore((s) => s.totalScore);
  const currentStreak = useGameStore((s) => s.currentStreak);
  const playbackState = useGameStore((s) => s.playbackState);
  const setVolume = useGameStore((s) => s.setVolume);
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
    <header className="fixed top-0 left-0 right-0 z-30 px-3 py-2 sm:px-6 sm:py-4 safe-top pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand & Quit */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <div className="radio-pill px-3 py-1.5 rounded-full flex items-center space-x-2 border border-white/10 shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-bold tracking-widest text-xs sm:text-sm bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              JINGLE
            </span>
            <span className="hidden md:inline-block text-[10px] uppercase font-mono tracking-widest text-emerald-400/90 pl-1 border-l border-white/10">
              ON AIR
            </span>
          </div>

          <button
            onClick={resetGame}
            title="Exit Game"
            aria-label="Exit game and return to main screen"
            className="p-1.5 sm:p-2 rounded-full radio-pill hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Center: Round Indicator */}
        <div className="radio-pill px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-white/10 shadow-xl pointer-events-auto flex items-center space-x-2">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Round
          </span>
          <div className="flex items-baseline space-x-0.5 sm:space-x-1">
            <span className="text-sm sm:text-base font-bold text-white tabular-nums">
              {currentRoundNumber}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">/{totalRounds}</span>
          </div>

          {/* Mini progress dots on larger screens */}
          <div className="hidden md:flex items-center space-x-1 ml-2 pl-2 border-l border-white/10">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i < currentRoundIndex
                    ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                    : i === currentRoundIndex
                    ? "bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: Streak & Score & Audio */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 pointer-events-auto">
          {/* Streak Badge */}
          {currentStreak > 0 && (
            <div
              className={`flex items-center space-x-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold border transition-all duration-300 ${
                streakTier.badgeColor
              } ${currentStreak >= 3 ? "animate-glow-fire" : ""}`}
            >
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current animate-bounce" />
              <span className="tabular-nums">{currentStreak}</span>
              {streakTier.multiplier > 1.0 && (
                <span className="text-[10px] opacity-90 font-mono">
                  {streakTier.multiplier}x
                </span>
              )}
            </div>
          )}

          {/* Score Counter */}
          <div className="radio-pill px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-white/10 shadow-lg flex items-center space-x-1.5">
            <span className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider hidden sm:inline">
              Score
            </span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-emerald-300 tabular-nums">
              {totalScore.toLocaleString()}
            </span>
          </div>

          {/* Volume Control */}
          <div className="relative">
            <div className="radio-pill p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-white/10 shadow-lg flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                title={playbackState.isMuted ? "Unmute" : "Mute"}
                aria-label={playbackState.isMuted ? "Unmute audio" : "Mute audio"}
              >
                {playbackState.isMuted || playbackState.volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                ) : playbackState.volume < 0.5 ? (
                  <Volume1 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                )}
              </button>

              {/* Slider for tablets & desktops */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={playbackState.isMuted ? 0 : playbackState.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Volume slider"
                title={`Volume: ${Math.round((playbackState.isMuted ? 0 : playbackState.volume) * 100)}%`}
                className="hidden sm:block w-16 sm:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
