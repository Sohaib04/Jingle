"use client";

import React, { useEffect } from "react";
import { useMultiplayerStore } from "@/lib/multiplayer/store";
import confetti from "canvas-confetti";
import {
  Award,
  Crown,
  Flame,
  RotateCcw,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { formatDistance } from "@/lib/geo/distance";

export default function BattleFinalScore() {
  const status = useMultiplayerStore((s) => s.status);
  const self = useMultiplayerStore((s) => s.self);
  const opponent = useMultiplayerStore((s) => s.opponent);
  const winnerId = useMultiplayerStore((s) => s.winnerId);
  const roundHistory = useMultiplayerStore((s) => s.roundHistory);
  const matchAbandonReason = useMultiplayerStore((s) => s.matchAbandonReason);
  const findMatch = useMultiplayerStore((s) => s.findMatch);
  const leaveMatch = useMultiplayerStore((s) => s.leaveMatch);
  const difficulty = useMultiplayerStore((s) => s.difficulty);

  const isAbandon = status === "opponentDisconnected";
  const isComplete = status === "matchComplete";

  const isWon = isAbandon || winnerId === self?.id;
  const isDraw = winnerId === "draw";
  const isDefeat = !isWon && !isDraw;

  // Trigger celebration confetti on victory!
  useEffect(() => {
    if (isWon && (isComplete || isAbandon)) {
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10b981", "#06b6d4", "#f59e0b", "#3b82f6", "#ec4899"],
      });
    }
  }, [isWon, isComplete, isAbandon]);

  if (!isComplete && !isAbandon) {
    return null;
  }

  const selfScore = self?.score || 0;
  const oppScore = opponent?.score || 0;

  // Compute round win counts from history
  const selfRoundsWon = roundHistory.filter((r) => r.winnerId === self?.id).length;
  const oppRoundsWon = roundHistory.filter((r) => r.winnerId === opponent?.id).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-400">
      <div className="radio-panel max-w-lg w-full rounded-3xl border border-white/20 p-5 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Match Result Badge & Headline */}
        <div className="space-y-2">
          <div
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest border ${
              isWon
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/20"
                : isDefeat
                ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                : "bg-amber-500/20 text-amber-300 border-amber-500/50"
            }`}
          >
            {isWon ? (
              <>
                <Crown className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>VICTORY ROYALE</span>
              </>
            ) : isDefeat ? (
              <>
                <Swords className="w-4 h-4 text-rose-400" />
                <span>BATTLE DEFEAT</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4 text-amber-400" />
                <span>HONORABLE DRAW</span>
              </>
            )}
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isAbandon
              ? "VICTORY BY FORFEIT!"
              : isWon
              ? "YOU CONQUERED THE DUEL!"
              : isDefeat
              ? "RIVAL TOOK THE MATCH"
              : "MATCH TIED!"}
          </h2>

          {isAbandon && (
            <p className="text-xs text-rose-400 font-mono">
              {matchAbandonReason || "Opponent disconnected from the radio tower"}
            </p>
          )}
        </div>

        {/* Head-to-Head Final Scores */}
        <div className="grid grid-cols-5 items-center gap-2 sm:gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          {/* YOU */}
          <div className="col-span-2 text-center space-y-1">
            <div className="text-3xl sm:text-4xl">{self?.avatar || "🎧"}</div>
            <div className="font-bold text-white text-xs sm:text-sm truncate">
              {self?.name || "You"}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
              {selfScore.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-emerald-400 font-semibold">
              {selfRoundsWon} Rounds Won
            </div>
          </div>

          {/* VS Divider */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <span className="text-xs font-black text-slate-500 uppercase font-mono">VS</span>
          </div>

          {/* OPPONENT */}
          <div className="col-span-2 text-center space-y-1">
            <div className="text-3xl sm:text-4xl">{opponent?.avatar || "🎧"}</div>
            <div className="font-bold text-white text-xs sm:text-sm truncate">
              {opponent?.name || "Opponent"}
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
              {oppScore.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-amber-400 font-semibold">
              {oppRoundsWon} Rounds Won
            </div>
          </div>
        </div>

        {/* 10-Round Timeline Breakdown */}
        {roundHistory.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span>10-Round Duel History</span>
              <span className="text-emerald-400">Green = You</span>
            </div>
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
              {Array.from({ length: 10 }).map((_, idx) => {
                const round = roundHistory[idx];
                const roundWin = round ? round.winnerId === self?.id : false;
                const roundLoss = round ? round.winnerId === opponent?.id : false;

                return (
                  <div
                    key={idx}
                    title={
                      round
                        ? `Round ${idx + 1}: ${round.song.title} (${round.actualCountry.name})`
                        : `Round ${idx + 1}`
                    }
                    className={`h-7 sm:h-8 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold border transition-all ${
                      roundWin
                        ? "bg-emerald-500/30 text-emerald-300 border-emerald-500/60 shadow-sm"
                        : roundLoss
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : round
                        ? "bg-white/10 text-slate-400 border-white/10"
                        : "bg-white/5 text-slate-600 border-white/5"
                    }`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => findMatch(difficulty)}
            className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center space-x-2"
          >
            <Swords className="w-4 h-4" />
            <span>Find New Match</span>
          </button>

          <button
            onClick={leaveMatch}
            className="py-3.5 px-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
