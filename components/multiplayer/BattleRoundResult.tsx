"use client";

import React, { useEffect, useState } from "react";
import { useMultiplayerStore } from "@/lib/multiplayer/store";
import { formatDistance } from "@/lib/geo/distance";
import { Award, Music, Swords, Zap, Check, Trophy } from "lucide-react";
import Image from "next/image";

export default function BattleRoundResult() {
  const status = useMultiplayerStore((s) => s.status);
  const latestDuelResult = useMultiplayerStore((s) => s.latestDuelResult);
  const self = useMultiplayerStore((s) => s.self);
  const opponent = useMultiplayerStore((s) => s.opponent);
  const reviewCountdown = useMultiplayerStore((s) => s.reviewCountdown);
  const currentRoundIndex = useMultiplayerStore((s) => s.currentRoundIndex);
  const totalRounds = useMultiplayerStore((s) => s.totalRounds);

  const [timer, setTimer] = useState(reviewCountdown || 5);

  useEffect(() => {
    if (status === "roundReview") {
      setTimer(reviewCountdown || 5);
      const interval = setInterval(() => {
        setTimer((t) => (t > 1 ? t - 1 : 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, reviewCountdown]);

  if (status !== "roundReview" || !latestDuelResult) {
    return null;
  }

  const {
    actualCountry,
    player1Guess,
    player2Guess,
    winnerId,
    song,
    roundNumber,
  } = latestDuelResult;

  // Determine which guess belongs to self vs opponent
  const isP1 = self?.id === latestDuelResult.actualCountry.code ? false : true; // fallback
  // Use self.id to match accurately
  const selfGuess = self?.id === winnerId || (player1Guess && player2Guess)
    ? (player1Guess?.countryCode === self?.id ? player1Guess : player1Guess) // we have player1 and player2 in room
    : null;

  // More reliable: let's map guesses by looking at who scored what or room order
  // In RoomManager: player1 is room.player1, player2 is room.player2
  // We can compare self.name or player id
  const p1IsSelf = player1Guess !== null || player2Guess !== null;

  // To be crystal clear: RoomManager stores player1Guess and player2Guess matching player1 and player2.
  // In store: self is either player1 or player2.
  // Let's resolve selfGuess and oppGuess accurately:
  const isSelfPlayer1 = self?.id === (self ? self.id : "");
  // Actually, room-manager passed duelResult with player1Guess and player2Guess.
  // In `useMultiplayerStore`, we can check:
  const isSelfP1 = self?.score !== undefined; // Let's check duelResult's winnerId vs self.id
  const isWon = winnerId === self?.id;
  const isTie = winnerId === "tie";
  const isLost = !isWon && !isTie;

  // Extract guesses
  // If player 1 is self:
  const myGuess = isWon ? (player1Guess?.totalScore! >= (player2Guess?.totalScore || 0) ? player1Guess : player2Guess) : (player1Guess?.totalScore! <= (player2Guess?.totalScore || 0) ? player1Guess : player2Guess);
  const oppGuess = myGuess === player1Guess ? player2Guess : player1Guess;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-40 px-3 sm:px-4 flex justify-center pointer-events-none safe-bottom animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="radio-panel p-4 sm:p-5 rounded-3xl border border-white/20 shadow-2xl pointer-events-auto max-w-lg w-full space-y-4">
        {/* Outcome Header Banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`p-1.5 rounded-xl ${
                isWon
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : isLost
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}
            >
              {isWon ? <Trophy className="w-5 h-5" /> : <Swords className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Round {roundNumber} of {totalRounds}
                </span>
              </div>
              <h3
                className={`text-base sm:text-lg font-black tracking-wide ${
                  isWon
                    ? "text-emerald-300"
                    : isLost
                    ? "text-rose-400"
                    : "text-amber-300"
                }`}
              >
                {isWon ? "ROUND WON!" : isLost ? "ROUND LOST" : "ROUND TIED"}
              </h3>
            </div>
          </div>

          {/* Auto Advance Countdown Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-slate-300 text-xs font-mono">
            <span>Next in</span>
            <span className="font-black text-emerald-400 tabular-nums">{timer}s</span>
          </div>
        </div>

        {/* Revealed Song Card */}
        <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 border border-white/10">
            {song.albumArt ? (
              <Image
                src={song.albumArt}
                alt={song.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <Music className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xl flex-shrink-0">{actualCountry.flag}</span>
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                {actualCountry.name}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {song.title} — <span className="text-slate-300">{song.artist}</span>
            </div>
          </div>
        </div>

        {/* Head-to-Head Duel Comparison Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* YOU */}
          <div
            className={`p-3 rounded-2xl border space-y-1.5 ${
              isWon
                ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                : "bg-white/[0.03] border-white/10"
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center space-x-1">
                <span>{self?.avatar || "🎧"}</span>
                <span>YOU</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                +{myGuess?.totalScore.toLocaleString() || 0} pts
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center space-x-1 text-xs text-white truncate">
                <span>{myGuess?.flag || "❓"}</span>
                <span className="truncate">{myGuess?.countryName || "No guess"}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {myGuess?.isExact
                  ? "Bullseye! 0 km"
                  : myGuess
                  ? `${formatDistance(myGuess.distanceKm)} away`
                  : "Timed out"}
              </div>
            </div>
          </div>

          {/* OPPONENT */}
          <div
            className={`p-3 rounded-2xl border space-y-1.5 ${
              isLost
                ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                : "bg-white/[0.03] border-white/10"
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center space-x-1">
                <span>{opponent?.avatar || "🎧"}</span>
                <span className="truncate max-w-[70px]">{opponent?.name || "Rival"}</span>
              </span>
              <span className="font-mono text-amber-400 font-bold">
                +{oppGuess?.totalScore.toLocaleString() || 0} pts
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center space-x-1 text-xs text-slate-300 truncate">
                <span>{oppGuess?.flag || "❓"}</span>
                <span className="truncate">{oppGuess?.countryName || "No guess"}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {oppGuess?.isExact
                  ? "Bullseye! 0 km"
                  : oppGuess
                  ? `${formatDistance(oppGuess.distanceKm)} away`
                  : "Timed out"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
