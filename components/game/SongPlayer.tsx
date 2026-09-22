"use client";

import React from "react";
import { useGameStore } from "@/lib/game/store";
import { useMultiplayerStore } from "@/lib/multiplayer/store";
import { Play, Pause, Radio, Disc, Clock } from "lucide-react";
import Image from "next/image";

export default function SongPlayer() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const rounds = useGameStore((s) => s.rounds);
  const currentRoundIndex = useGameStore((s) => s.currentRoundIndex);
  const soloTimeRemaining = useGameStore((s) => s.timeRemaining);
  const isPlaying = useGameStore((s) => s.playbackState.isPlaying);
  const togglePlayPause = useGameStore((s) => s.togglePlayPause);

  const mpStatus = useMultiplayerStore((s) => s.status);
  const mpCurrentSong = useMultiplayerStore((s) => s.currentSong);
  const mpTimeRemaining = useMultiplayerStore((s) => s.timeRemaining);

  const isMp = mpStatus === "roundActive" || mpStatus === "roundReview";
  const currentSong = isMp ? mpCurrentSong : rounds[currentRoundIndex];
  const timeRemaining = isMp ? mpTimeRemaining : soloTimeRemaining;

  if (!currentSong) {
    return null;
  }

  if (!isMp && (gameStatus === "idle" || gameStatus === "loading")) {
    return null;
  }

  const isRevealed = isMp
    ? mpStatus === "roundReview"
    : gameStatus === "revealing" || gameStatus === "roundResult";
  const timerWarning = timeRemaining <= 5;

  return (
    <div className="fixed top-14 left-3 right-3 sm:top-20 sm:left-6 sm:right-auto z-20 pointer-events-auto transform-gpu">
      <div className="radio-panel p-2.5 sm:p-3.5 rounded-2xl border border-white/10 shadow-2xl flex items-center space-x-3 sm:space-x-4 max-w-full sm:max-w-[340px] transition-all duration-300">
        {/* Album Artwork / Vinyl Disk */}
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-white/10 shadow-inner group">
          {isRevealed ? (
            <Image
              src={currentSong.albumArt}
              alt={currentSong.title}
              fill
              unoptimized
              sizes="(max-width: 640px) 48px, 64px"
              className="object-cover transition-opacity duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center relative">
              {/* Spinning vinyl disk effect */}
              <div
                className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full border border-emerald-500/30 bg-slate-950 flex items-center justify-center ${
                  isPlaying ? "animate-spin" : ""
                }`}
                style={{ animationDuration: "3.5s" }}
              >
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center">
                  <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-emerald-300 shadow-[0_0_4px_#10b981]" />
                </div>
              </div>
              <Disc className="absolute w-5 h-5 sm:w-6 sm:h-6 text-emerald-400/40" />
            </div>
          )}

          {/* Play/Pause hover overlay */}
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px] cursor-pointer"
            title={isPlaying ? "Pause Stream" : "Resume Stream"}
            aria-label={isPlaying ? "Pause audio stream" : "Play audio stream"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Track Info & Visualizer */}
        <div className="flex-1 min-w-0 pr-0.5">
          {isRevealed ? (
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                {currentSong.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-emerald-300 font-medium truncate">
                {currentSong.artist}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">
                  FREQUENCY: BROADCASTING
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 truncate">
                Pinpoint the broadcast origin on Earth
              </p>
            </div>
          )}

          {/* Audio Equalizer & Countdown Timer */}
          <div className="mt-1.5 sm:mt-2 flex items-center justify-between space-x-2">
            {/* GPU-Accelerated Waveform Equalizer */}
            <div className="flex items-end space-x-1 h-4 sm:h-5">
              <span
                className={`w-1 bg-emerald-400 rounded-full h-full ${
                  isPlaying ? "audio-bar-1" : "scale-y-[0.2] opacity-40"
                }`}
              />
              <span
                className={`w-1 bg-teal-400 rounded-full h-full ${
                  isPlaying ? "audio-bar-2" : "scale-y-[0.2] opacity-40"
                }`}
              />
              <span
                className={`w-1 bg-cyan-400 rounded-full h-full ${
                  isPlaying ? "audio-bar-3" : "scale-y-[0.2] opacity-40"
                }`}
              />
              <span
                className={`w-1 bg-emerald-300 rounded-full h-full ${
                  isPlaying ? "audio-bar-4" : "scale-y-[0.2] opacity-40"
                }`}
              />
              <span
                className={`w-1 bg-emerald-500 rounded-full h-full ${
                  isPlaying ? "audio-bar-5" : "scale-y-[0.2] opacity-40"
                }`}
              />
            </div>

            {/* Countdown timer pill */}
            <div
              className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-mono font-bold transition-all duration-200 ${
                timerWarning
                  ? "bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                  : "bg-white/5 text-slate-300 border border-white/10"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{timeRemaining}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
