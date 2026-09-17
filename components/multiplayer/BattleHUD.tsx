"use client";

import React, { useEffect } from "react";
import { useMultiplayerStore } from "@/lib/multiplayer/store";
import { Check, Flame, Loader2, RotateCcw, Swords, Zap } from "lucide-react";

export default function BattleHUD() {
  const status = useMultiplayerStore((s) => s.status);
  const self = useMultiplayerStore((s) => s.self);
  const opponent = useMultiplayerStore((s) => s.opponent);
  const currentRoundIndex = useMultiplayerStore((s) => s.currentRoundIndex);
  const totalRounds = useMultiplayerStore((s) => s.totalRounds);
  const timeRemaining = useMultiplayerStore((s) => s.timeRemaining);
  const opponentHasLockedIn = useMultiplayerStore((s) => s.opponentHasLockedIn);
  const hasLockedIn = useMultiplayerStore((s) => s.hasLockedIn);
  const leaveMatch = useMultiplayerStore((s) => s.leaveMatch);
  const tickTimer = useMultiplayerStore((s) => s.tickTimer);

  // Round countdown timer tick
  useEffect(() => {
    if (status === "roundActive") {
      const interval = setInterval(() => {
        tickTimer();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, tickTimer]);

  if (
    status !== "roundActive" &&
    status !== "roundReview" &&
    status !== "roundRevealing"
  ) {
    return null;
  }

  const selfScore = self?.score || 0;
  const oppScore = opponent?.score || 0;
  const scoreDiff = selfScore - oppScore;

  // Score ratio for tug-of-war bar
  const totalPoints = selfScore + oppScore;
  const selfPct =
    totalPoints === 0 ? 50 : Math.min(85, Math.max(15, Math.round((selfScore / totalPoints) * 100)));

  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-3 py-2 sm:px-6 sm:py-3.5 safe-top pointer-events-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Left: You & Forfeit button */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={() => {
              if (window.confirm("Leave match? This will forfeit the battle.")) {
                leaveMatch();
              }
            }}
            title="Leave Match"
            className="p-1.5 sm:p-2 rounded-full radio-pill hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer border border-white/5"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Self Player Card */}
          <div className="radio-pill px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-2xl border border-emerald-500/30 shadow-lg flex items-center space-x-2 sm:space-x-2.5 bg-emerald-950/20">
            <span className="text-xl sm:text-2xl select-none">{self?.avatar || "🎧"}</span>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[80px] sm:max-w-[120px]">
                  {self?.name || "You"}
                </span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  YOU
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xs sm:text-sm md:text-base font-black text-emerald-300 tabular-nums">
                  {selfScore.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-mono">pts</span>
              </div>
            </div>

            {hasLockedIn && (
              <div className="hidden sm:flex items-center space-x-0.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                <Check className="w-3 h-3" />
                <span>LOCKED</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Match Round, Timer, and Tug-of-War Score Lead */}
        <div className="flex flex-col items-center pointer-events-auto space-y-1">
          {/* Round & Timer Pill */}
          <div className="radio-pill px-3 py-1 sm:px-4 sm:py-1 rounded-full border border-white/15 shadow-xl flex items-center space-x-2.5 sm:space-x-3">
            {/* Round Count */}
            <div className="flex items-baseline space-x-0.5 text-xs font-bold text-white">
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider mr-0.5">
                R
              </span>
              <span className="tabular-nums font-mono text-sm sm:text-base">
                {currentRoundIndex + 1}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">/{totalRounds}</span>
            </div>

            {/* Duel Timer */}
            <div
              className={`flex items-center space-x-1 px-2 py-0.5 rounded-full font-mono text-xs sm:text-sm font-black tabular-nums transition-colors ${
                timeRemaining <= 5
                  ? "bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse"
                  : opponentHasLockedIn && !hasLockedIn
                  ? "bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse"
                  : "bg-white/10 text-white"
              }`}
            >
              <span>{timeRemaining}s</span>
            </div>
          </div>

          {/* Tug-of-War Lead Indicator & Progress Bar */}
          <div className="w-40 sm:w-56 space-y-0.5">
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-0.5">
              <span className={scoreDiff > 0 ? "text-emerald-400 font-bold" : ""}>
                {scoreDiff > 0 ? `+${scoreDiff.toLocaleString()}` : ""}
              </span>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest">
                {scoreDiff === 0 ? "TIED" : scoreDiff > 0 ? "LEAD" : "TRAIL"}
              </span>
              <span className={scoreDiff < 0 ? "text-amber-400 font-bold" : ""}>
                {scoreDiff < 0 ? `+${Math.abs(scoreDiff).toLocaleString()}` : ""}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-l-full"
                style={{ width: `${selfPct}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-500 rounded-r-full"
                style={{ width: `${100 - selfPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Opponent Player Card & Lock Status */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* Lock Status Badge */}
          {opponentHasLockedIn ? (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-bold animate-pulse shadow-sm">
              <Check className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">LOCKED IN</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-full bg-white/[0.04] text-slate-400 text-[10px] font-mono">
              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              <span>Thinking...</span>
            </div>
          )}

          {/* Opponent Card */}
          <div className="radio-pill px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-2xl border border-amber-500/30 shadow-lg flex items-center space-x-2 sm:space-x-2.5 bg-amber-950/20">
            <div className="min-w-0 text-right">
              <div className="flex items-center justify-end space-x-1.5">
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                  RIVAL
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[80px] sm:max-w-[120px]">
                  {opponent?.name || "Opponent"}
                </span>
              </div>
              <div className="flex items-baseline justify-end space-x-1">
                <span className="text-xs sm:text-sm md:text-base font-black text-amber-300 tabular-nums">
                  {oppScore.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-mono">pts</span>
              </div>
            </div>
            <span className="text-xl sm:text-2xl select-none">{opponent?.avatar || "🎧"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
