"use client";

import React from "react";
import { useGameStore } from "@/lib/game/store";
import { Play, Pause, Music2, Disc, Clock } from "lucide-react";
import Image from "next/image";

export default function SongPlayer() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const rounds = useGameStore((s) => s.rounds);
  const currentRoundIndex = useGameStore((s) => s.currentRoundIndex);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const playbackState = useGameStore((s) => s.playbackState);
  const togglePlayPause = useGameStore((s) => s.togglePlayPause);

  const currentSong = rounds[currentRoundIndex];
  if (!currentSong || gameStatus === "idle" || gameStatus === "loading") {
    return null;
  }

  const isRevealed = gameStatus === "revealing" || gameStatus === "roundResult";
  const timerWarning = timeRemaining <= 5;

  return (
    <div className="fixed top-18 left-4 sm:top-20 sm:left-6 z-20 pointer-events-auto">
      <div className="glass-panel p-3 sm:p-3.5 rounded-2xl border border-white/10 shadow-2xl flex items-center space-x-3 sm:space-x-4 max-w-[340px] transition-all duration-300">
        {/* Album Artwork / Vinyl */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-white/10 shadow-inner group">
          {isRevealed ? (
            <Image
              src={currentSong.albumArt}
              alt={currentSong.title}
              fill
              sizes="(max-width: 640px) 56px, 64px"
              className="object-cover transition-opacity duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center relative">
              {/* Spinning vinyl disk effect */}
              <div
                className={`w-12 h-12 rounded-full border border-cyan-500/20 bg-slate-900/80 flex items-center justify-center ${
                  playbackState.isPlaying ? "animate-spin" : ""
                }`}
                style={{ animationDuration: "4s" }}
              >
                <div className="w-4 h-4 rounded-full bg-cyan-500/30 border border-cyan-400/50 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
              <Disc className="absolute w-6 h-6 text-cyan-400/40" />
            </div>
          )}

          {/* Play/Pause hover button */}
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]"
            title={playbackState.isPlaying ? "Pause" : "Play"}
          >
            {playbackState.isPlaying ? (
              <Pause className="w-5 h-5 text-white fill-current" />
            ) : (
              <Play className="w-5 h-5 text-white fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Track Info & Visualizer */}
        <div className="flex-1 min-w-0 pr-1">
          {isRevealed ? (
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-white truncate">
                {currentSong.title}
              </h4>
              <p className="text-xs text-cyan-300 font-medium truncate">
                {currentSong.artist}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5">
                <Music2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
                  Mystery Track
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Identify the country of origin
              </p>
            </div>
          )}

          {/* Audio Equalizer & Timer Bar */}
          <div className="mt-2 flex items-center justify-between space-x-3">
            {/* Waveform Equalizer */}
            <div className="flex items-end space-x-1 h-5">
              <span
                className={`w-1 bg-cyan-400 rounded-full ${
                  playbackState.isPlaying ? "audio-bar-1" : "h-1 opacity-40"
                }`}
              />
              <span
                className={`w-1 bg-cyan-300 rounded-full ${
                  playbackState.isPlaying ? "audio-bar-2" : "h-1 opacity-40"
                }`}
              />
              <span
                className={`w-1 bg-cyan-400 rounded-full ${
                  playbackState.isPlaying ? "audio-bar-3" : "h-1 opacity-40"
                }`}
              />
              <span
                className={`w-1 bg-cyan-200 rounded-full ${
                  playbackState.isPlaying ? "audio-bar-4" : "h-1 opacity-40"
                }`}
              />
              <span
                className={`w-1 bg-cyan-500 rounded-full ${
                  playbackState.isPlaying ? "audio-bar-5" : "h-1 opacity-40"
                }`}
              />
            </div>

            {/* Countdown timer pill */}
            <div
              className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold transition-colors ${
                timerWarning
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
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
