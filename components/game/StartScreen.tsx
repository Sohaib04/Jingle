"use client";

import React, { useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { Difficulty } from "@/lib/game/types";
import { Headphones, Play, Satellite, Sparkles, Zap, Loader2, Music } from "lucide-react";

export default function StartScreen() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const startGame = useGameStore((s) => s.startGame);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy");

  if (gameStatus !== "idle" && gameStatus !== "loading") {
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

        {/* Start Game Action */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => startGame(selectedDifficulty)}
            disabled={isLoading}
            className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Tuning 10 Frequencies...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Start Session (10 Rounds)</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Satellite & Night views switchable on side dock</span>
          </p>
        </div>
      </div>
    </div>
  );
}
