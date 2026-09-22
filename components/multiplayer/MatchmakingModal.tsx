"use client";

import React, { useState, useEffect } from "react";
import {
  useMultiplayerStore,
  generateRandomCallsign,
} from "@/lib/multiplayer/store";
import { Difficulty } from "@/lib/game/types";
import {
  Dices,
  Radio,
  Swords,
  X,
  Zap,
  Loader2,
  Shield,
  Music,
} from "lucide-react";

const AVATAR_OPTIONS = ["🎧", "📻", "⚡", "🛰️", "🛸", "🔥", "🎵", "🌍"];

export default function MatchmakingModal() {
  const show = useMultiplayerStore((s) => s.showMatchmakingModal);
  const status = useMultiplayerStore((s) => s.status);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const playerAvatar = useMultiplayerStore((s) => s.playerAvatar);
  const self = useMultiplayerStore((s) => s.self);
  const opponent = useMultiplayerStore((s) => s.opponent);
  const countdown = useMultiplayerStore((s) => s.countdown);
  const difficulty = useMultiplayerStore((s) => s.difficulty);

  const setPlayerName = useMultiplayerStore((s) => s.setPlayerName);
  const setPlayerAvatar = useMultiplayerStore((s) => s.setPlayerAvatar);
  const closeMatchmakingModal = useMultiplayerStore((s) => s.closeMatchmakingModal);
  const findMatch = useMultiplayerStore((s) => s.findMatch);
  const cancelMatchmaking = useMultiplayerStore((s) => s.cancelMatchmaking);

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulty || "easy");

  useEffect(() => {
    if (difficulty) {
      setSelectedDifficulty(difficulty);
    }
  }, [difficulty]);

  if (!show && status === "idle") {
    return null;
  }

  // If match has started into countdown or active battle, modal disappears
  if (status === "roundActive" || status === "roundReview" || status === "matchComplete") {
    return null;
  }

  const isSearching = status === "queueing";
  const isMatched = status === "matched" || status === "countdown";

  const handleRandomizeCallsign = () => {
    setPlayerName(generateRandomCallsign());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="radio-panel max-w-md w-full rounded-3xl border border-white/20 p-5 sm:p-7 shadow-2xl space-y-5 relative">
        {/* Close button (only when not matched) */}
        {!isMatched && (
          <button
            onClick={closeMatchmakingModal}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* 1. MATCHED / VS COUNTDOWN SCREEN */}
        {isMatched ? (
          <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-300">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>Frequency Locked</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              OPPONENT FOUND!
            </h2>

            {/* VS Head-to-Head Cards */}
            <div className="grid grid-cols-5 items-center gap-2 py-2">
              {/* Player 1 Card */}
              <div className="col-span-2 p-3.5 rounded-2xl bg-white/[0.04] border border-emerald-500/30 text-center space-y-1">
                <div className="text-3xl sm:text-4xl">{self?.avatar || playerAvatar}</div>
                <div className="font-bold text-white text-xs sm:text-sm truncate">
                  {self?.name || playerName}
                </div>
                <div className="text-[10px] font-mono text-emerald-400">YOU</div>
              </div>

              {/* VS Emblem with Countdown */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center font-black text-white text-lg sm:text-xl shadow-lg shadow-amber-500/30 animate-pulse">
                  {countdown}
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                  START
                </span>
              </div>

              {/* Player 2 / Opponent Card */}
              <div className="col-span-2 p-3.5 rounded-2xl bg-white/[0.04] border border-amber-500/30 text-center space-y-1">
                <div className="text-3xl sm:text-4xl">{opponent?.avatar || "🎧"}</div>
                <div className="font-bold text-white text-xs sm:text-sm truncate">
                  {opponent?.name || "RivalPilot"}
                </div>
                <div className="text-[10px] font-mono text-amber-400">OPPONENT</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              10 Rounds • 20s per song • GeoGuessr Duel Rules
            </p>
          </div>
        ) : isSearching ? (
          /* 2. SEARCHING / RADAR SCREEN */
          <div className="text-center py-6 space-y-5">
            {/* Sonar Radar Pulse Animation */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-40 duration-1000" />
              <div className="absolute inset-2 rounded-full border border-teal-500/30 animate-ping opacity-50 duration-700" />
              <div className="absolute inset-4 rounded-full border border-cyan-500/40 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <Radio className="w-8 h-8 text-emerald-400 animate-spin" style={{ animationDuration: "6s" }} />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Scanning Radio Frequencies...
              </h3>
              <p className="text-xs text-slate-400">
                Searching for an opponent selecting {selectedDifficulty.toUpperCase()} difficulty
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs font-mono text-emerald-400/90 py-1">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Looking for {selectedDifficulty.toUpperCase()} tier challenger</span>
            </div>

            <button
              onClick={cancelMatchmaking}
              className="py-2.5 px-6 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Cancel Search
            </button>
          </div>
        ) : (
          /* 3. LOBBY CONFIGURATION SCREEN */
          <div className="space-y-5">
            {/* Modal Header */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Swords className="w-3.5 h-3.5 text-rose-400" />
                <span>1v1 Head-to-Head Duel</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                BATTLE ARENA
              </h2>
              <p className="text-xs text-slate-400">
                Randomly match with an opponent and duel across 10 global songs!
              </p>
            </div>

            {/* Callsign Input & Randomizer */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block text-left">
                Pilot Callsign
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={18}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-white/[0.04] border border-white/15 text-white font-bold text-sm focus:outline-none focus:border-emerald-500/60 transition"
                    placeholder="Enter your callsign..."
                  />
                </div>
                <button
                  onClick={handleRandomizeCallsign}
                  type="button"
                  title="Randomize Callsign"
                  className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <Dices className="w-5 h-5 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block text-left">
                Pilot Emblem
              </label>
              <div className="grid grid-cols-8 gap-1.5">
                {AVATAR_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setPlayerAvatar(icon)}
                    className={`h-10 rounded-xl flex items-center justify-center text-lg border transition cursor-pointer ${
                      playerAvatar === icon
                        ? "bg-emerald-500/25 border-emerald-400 shadow-md scale-105"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.08]"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block text-left">
                Difficulty Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedDifficulty(level)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      selectedDifficulty === level
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-500/10"
                        : "bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/[0.06] hover:text-slate-200"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Find Match Action Button */}
            <div className="pt-2">
              <button
                onClick={() => findMatch(selectedDifficulty)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 hover:from-rose-400 hover:to-emerald-400 text-white font-bold text-sm sm:text-base shadow-xl shadow-rose-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
              >
                <Swords className="w-5 h-5 fill-current" />
                <span>Find Match (10 Rounds)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
