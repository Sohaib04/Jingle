"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import confetti from "canvas-confetti";
import {
  Award,
  Calendar,
  Check,
  Copy,
  Flame,
  Home,
  Navigation,
  RotateCcw,
  Timer,
  Trophy,
} from "lucide-react";
import { formatDistance } from "@/lib/geo/distance";

export default function FinalScore() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const totalScore = useGameStore((s) => s.totalScore);
  const bestStreak = useGameStore((s) => s.bestStreak);
  const roundResults = useGameStore((s) => s.roundResults);
  const difficulty = useGameStore((s) => s.difficulty);
  const roundsCount = useGameStore((s) => s.roundsCount);
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);

  const [copied, setCopied] = useState(false);
  const [showDailyToast, setShowDailyToast] = useState(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    if (gameStatus === "gameComplete") {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#06b6d4", "#3b82f6", "#f59e0b", "#14b8a6"],
      });
    }
  }, [gameStatus]);

  if (gameStatus !== "gameComplete") {
    return null;
  }

  const exactMatches = roundResults.filter((r) => r.isExact).length;
  const totalDistance = roundResults.reduce((sum, r) => sum + r.distanceKm, 0);
  const avgTime =
    roundResults.length > 0
      ? (
          roundResults.reduce((sum, r) => sum + r.responseTimeSeconds, 0) /
          roundResults.length
        ).toFixed(1)
      : "0.0";

  // Share result formatter
  function handleShare() {
    const summaryText = `🌐 Jingle — World Audio Observatory\n🏆 Score: ${totalScore.toLocaleString()} pts\n🎯 Accuracy: ${exactMatches}/${roundResults.length} Exact\n🔥 Best Streak: ${bestStreak}\n✈️ Total Distance: ${formatDistance(totalDistance)}\n\nPlay Jingle at: https://jingle.game`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300 safe-top safe-bottom">
      <div className="radio-panel max-w-xl w-full rounded-3xl border border-white/15 p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 text-center my-auto">
        {/* Trophy icon & header */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10 animate-bounce">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="text-[11px] font-mono font-bold text-emerald-400 tracking-widest uppercase">
            Planetary Session Report
          </div>
          <div className="text-4xl sm:text-6xl font-black tracking-tight text-white tabular-nums drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            {totalScore.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">Total Points Earned</p>
        </div>

        {/* Stats 4-Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-left">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5 sm:space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-medium">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exact</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white tabular-nums">
              {exactMatches} / {roundResults.length}
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5 sm:space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Streak</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white tabular-nums">
              {bestStreak}
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5 sm:space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-medium">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Distance</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white tabular-nums truncate">
              {totalDistance.toLocaleString()} km
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5 sm:space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-medium">
              <Timer className="w-3.5 h-3.5 text-teal-400" />
              <span>Avg Speed</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-white tabular-nums">
              {avgTime}s
            </div>
          </div>
        </div>

        {/* Round by Round Breakdown */}
        <div className="space-y-1.5 text-left">
          <h4 className="text-[11px] sm:text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider px-1">
            Broadcast Log
          </h4>
          <div className="max-h-44 sm:max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {roundResults.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors text-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="text-base select-none">{r.actualCountry.flag}</span>
                  <div className="min-w-0">
                    <span className="font-semibold text-white block truncate">
                      {r.song.title}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate block">
                      {r.song.artist} • {r.actualCountry.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3 text-right flex-shrink-0">
                  <span className="text-[11px] text-slate-400">
                    {r.isExact ? (
                      <span className="text-emerald-400 font-bold">Exact</span>
                    ) : (
                      `${r.distanceKm.toLocaleString()} km`
                    )}
                  </span>
                  <span className="font-bold text-emerald-300 tabular-nums">
                    +{r.totalScore.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 sm:space-y-2.5 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            <button
              onClick={() => startGame(difficulty, roundResults.length || roundsCount || 5)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Play Again</span>
            </button>

            <button
              onClick={resetGame}
              className="w-full py-3.5 px-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span>Main Menu</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setShowDailyToast(true);
                setTimeout(() => setShowDailyToast(false), 2500);
              }}
              className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl radio-pill hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span>Daily Challenge</span>
            </button>

            <button
              onClick={handleShare}
              className="py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl radio-pill hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                  <span>Share Result</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showDailyToast && (
          <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 py-2 px-3 rounded-xl animate-in fade-in duration-200">
            🌅 Daily Challenge resets at 00:00 UTC. Check back soon!
          </div>
        )}
      </div>
    </div>
  );
}
