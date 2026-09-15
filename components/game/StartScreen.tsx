"use client";

import React, { useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { Difficulty } from "@/lib/game/types";
import { Globe2, Headphones, Play, Sparkles, Zap } from "lucide-react";

export default function StartScreen() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const startGame = useGameStore((s) => s.startGame);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy");

  if (gameStatus !== "idle" && gameStatus !== "loading") {
    return null;
  }

  const isLoading = gameStatus === "loading";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
      <div className="glass-panel max-w-lg w-full rounded-3xl border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 pointer-events-auto animate-in fade-in zoom-in-95 duration-400">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>3D Music Geography</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center space-x-2">
            <span>GEO</span>
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              TUNE
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-medium">
            Listen to a song. Guess which country it&apos;s from on the 3D globe.
          </p>
        </div>

        {/* How to Play Pills */}
        <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <div className="w-7 h-7 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
              <Headphones className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white block">1. Listen</span>
            <span className="text-[11px] text-slate-400 block leading-snug">
              Hear 30 seconds of world music
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <Globe2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white block">2. Locate</span>
            <span className="text-[11px] text-slate-400 block leading-snug">
              Rotate & click the country on the globe
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white block">3. Score</span>
            <span className="text-[11px] text-slate-400 block leading-snug">
              Distance & speed reward up to 2x streak
            </span>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block text-left px-1">
            Song Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSelectedDifficulty(level)}
                className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  selectedDifficulty === level
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10"
                    : "bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/[0.06] hover:text-slate-200"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Action */}
        <div className="space-y-3 pt-1">
          <button
            onClick={() => startGame(selectedDifficulty)}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>
              {isLoading ? "Preparing 10 Rounds..." : "Start Classic Game (10 Rounds)"}
            </span>
          </button>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center space-x-1">
            <Headphones className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audio enabled • 3–5 minutes per game</span>
          </p>
        </div>
      </div>
    </div>
  );
}
