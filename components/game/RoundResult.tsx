"use client";

import React, { useEffect } from "react";
import { useGameStore } from "@/lib/game/store";
import { formatDistance, getCompassDirection } from "@/lib/geo/distance";
import { ArrowRight, Flame, MapPin, Music, Target, Zap } from "lucide-react";

export default function RoundResult() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const latestResult = useGameStore((s) => s.latestResult);
  const nextRound = useGameStore((s) => s.nextRound);
  const currentRoundIndex = useGameStore((s) => s.currentRoundIndex);
  const rounds = useGameStore((s) => s.rounds);

  // Keyboard shortcut: Press Enter or Space to go to next round
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === "Enter" || e.key === " ") && gameStatus === "roundResult") {
        e.preventDefault();
        nextRound();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStatus, nextRound]);

  if (gameStatus !== "roundResult" || !latestResult) {
    return null;
  }

  const {
    actualCountry,
    guessedCountry,
    distanceKm,
    baseScore,
    timeBonus,
    multiplier,
    totalScore,
    isExact,
    streak,
    song,
  } = latestResult;

  const isLastRound = currentRoundIndex + 1 >= rounds.length;

  const direction =
    guessedCountry && !isExact
      ? getCompassDirection(
          guessedCountry.lat,
          guessedCountry.lng,
          actualCountry.lat,
          actualCountry.lng
        )
      : null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/15 shadow-2xl pointer-events-auto max-w-md w-full space-y-4">
        {/* Status Header & Distance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isExact ? (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                <Target className="w-3.5 h-3.5" />
                <span>EXACT MATCH!</span>
              </div>
            ) : distanceKm < 1500 ? (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>CLOSE GUESS!</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>OFF TARGET</span>
              </div>
            )}

            <span className="text-xs text-slate-400 font-medium">
              {isExact
                ? "Direct hit"
                : `${formatDistance(distanceKm)} ${direction ? `(${direction})` : ""}`}
            </span>
          </div>

          {/* Points Awarded */}
          <div className="flex items-baseline space-x-1 text-emerald-400 font-extrabold text-lg sm:text-xl">
            <span>+{totalScore.toLocaleString()}</span>
            <span className="text-xs font-semibold text-emerald-400/70">pts</span>
          </div>
        </div>

        {/* Track & Country Reveal */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-3.5">
          <span className="text-4xl select-none flex-shrink-0">
            {actualCountry.flag}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base font-bold text-white truncate">
                {actualCountry.name}
              </span>
              <span className="text-xs text-slate-400 truncate">
                ({actualCountry.continent})
              </span>
            </div>
            <p className="text-xs text-cyan-300 font-medium truncate flex items-center space-x-1 mt-0.5">
              <Music className="w-3 h-3 flex-shrink-0" />
              <span>
                {song.artist} — {song.title}
              </span>
            </p>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-slate-400 block text-[10px] uppercase">Base</span>
            <span className="font-bold text-slate-200 tabular-nums">{baseScore}</span>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-slate-400 block text-[10px] uppercase flex items-center justify-center space-x-0.5">
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              <span>Speed</span>
            </span>
            <span className="font-bold text-slate-200 tabular-nums">+{timeBonus}</span>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-slate-400 block text-[10px] uppercase flex items-center justify-center space-x-0.5">
              <Flame className="w-2.5 h-2.5 text-orange-400" />
              <span>Streak</span>
            </span>
            <span className="font-bold text-slate-200 tabular-nums">
              {multiplier > 1.0 ? `${multiplier}x` : streak > 0 ? `${streak}` : "0"}
            </span>
          </div>
        </div>

        {/* Next Round Button */}
        <button
          onClick={nextRound}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <span>{isLastRound ? "View Final Results" : "Next Round"}</span>
          <ArrowRight className="w-4 h-4" />
          <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono font-normal">
            Enter
          </kbd>
        </button>
      </div>
    </div>
  );
}
