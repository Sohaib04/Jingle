"use client";

import React, { useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { Difficulty } from "@/lib/game/types";
import { Headphones, Play, Satellite, Sparkles, Zap, Loader2, Music, Swords, Minus, Plus } from "lucide-react";
import { useMultiplayerStore } from "@/lib/multiplayer/store";

export default function StartScreen() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const startGame = useGameStore((s) => s.startGame);
  const storeDifficulty = useGameStore((s) => s.difficulty);
  const storeRoundsCount = useGameStore((s) => s.roundsCount);
  const mpStatus = useMultiplayerStore((s) => s.status);
  const openMatchmakingModal = useMultiplayerStore((s) => s.openMatchmakingModal);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(storeDifficulty || "easy");
  const [selectedRounds, setSelectedRounds] = useState<number>(storeRoundsCount || 5);

  if (gameStatus !== "idle" && gameStatus !== "loading") {
    return null;
  }

  if (mpStatus !== "idle") {
    return null;
  }

  const isLoading = gameStatus === "loading";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 pointer-events-none safe-bottom safe-top">
      <div className="radio-panel max-w-lg w-full rounded-3xl border border-white/15 p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 pointer-events-auto animate-in fade-in zoom-in-95 duration-400">
        {/* Brand Header */}
        <div className="text-center">
          {/* Upper Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-mono font-bold tracking-widest uppercase shadow-sm mb-3">
            <Music className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Global Music Trivia</span>
          </div>

          {/* Logo with Musical Note Crown */}
          <div className="relative pt-7 pb-1 flex items-center justify-center">
            <h1 className="text-5xl sm:text-6xl font-black tracking-normal inline-flex items-center select-none">
              <span className="text-white">J</span>
              <span className="relative text-white inline-block">
                I
                {/* Clearly positioned musical note with ample headroom */}
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none">
                  <Music className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 stroke-[2.5] drop-shadow-[0_0_12px_rgba(16,185,129,0.9)] animate-pulse" />
                </span>
              </span>
              <span className="text-white">N</span>
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                GLE
              </span>
            </h1>
          </div>

          {/* Audio Wave Visualizer Accent */}
          <div className="flex items-center justify-center space-x-1.5 h-6 my-2.5">
            <span className="w-1.5 h-5 bg-emerald-400 rounded-full wave-bar-1 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
            <span className="w-1.5 h-5 bg-teal-400 rounded-full wave-bar-2 drop-shadow-[0_0_6px_rgba(45,212,191,0.5)]" />
            <span className="w-1.5 h-5 bg-cyan-400 rounded-full wave-bar-3 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            <span className="w-1.5 h-5 bg-teal-300 rounded-full wave-bar-4 drop-shadow-[0_0_6px_rgba(94,234,212,0.5)]" />
            <span className="w-1.5 h-5 bg-emerald-400 rounded-full wave-bar-5 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
          </div>

          <p className="text-xs sm:text-sm text-slate-300 font-normal max-w-sm mx-auto leading-relaxed mt-2">
            Tune into radio frequencies across the globe. Listen to the track, spin the satellite Earth, and identify the country.
          </p>
        </div>

        {/* 3 Steps Guide */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 text-center text-xs">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1 sm:space-y-1.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <Headphones className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white block text-[11px] sm:text-xs">1. Tune In</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block leading-tight">
              Hear 30s world music broadcast
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1 sm:space-y-1.5">
            <div className="w-7 h-7 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto">
              <Satellite className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white block text-[11px] sm:text-xs">2. Locate</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block leading-tight">
              Rotate satellite globe & lock target
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1 sm:space-y-1.5">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white block text-[11px] sm:text-xs">3. Score</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block leading-tight">
              Earn distance & streak multipliers
            </span>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] sm:text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block text-left px-1">
            Station Filter
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSelectedDifficulty(level)}
                className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  selectedDifficulty === level
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                    : "bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/[0.06] hover:text-slate-200"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Rounds Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] sm:text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
              Session Length
            </label>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              {selectedRounds} {selectedRounds === 1 ? "Round" : "Rounds"} (1-10)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Stepper with - / + */}
            <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-xl p-1 space-x-1">
              <button
                type="button"
                onClick={() => setSelectedRounds((r) => Math.max(1, r - 1))}
                disabled={selectedRounds <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Decrease rounds (min 1)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="w-8 text-center font-bold text-white font-mono text-xs sm:text-sm tabular-nums">
                {selectedRounds}
              </span>

              <button
                type="button"
                onClick={() => setSelectedRounds((r) => Math.min(10, r + 1))}
                disabled={selectedRounds >= 10}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Increase rounds (max 10)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1.5 flex-1">
              {[1, 3, 5, 10].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSelectedRounds(count)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                    selectedRounds === count
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                      : "bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/[0.06] hover:text-slate-200"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Game Mode Actions: Solo & 1v1 Battle Arena */}
        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => startGame(selectedDifficulty, selectedRounds)}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Tuning...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Solo ({selectedRounds} {selectedRounds === 1 ? "Round" : "Rounds"})</span>
                </>
              )}
            </button>

            <button
              onClick={openMatchmakingModal}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 hover:from-rose-400 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-rose-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 border border-white/10"
            >
              <Swords className="w-4 h-4 fill-current" />
              <span>1v1 Battle Duel</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Satellite & Night views switchable on side dock</span>
          </p>
        </div>
      </div>
    </div>
  );
}
