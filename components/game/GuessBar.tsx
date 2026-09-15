"use client";

import React, { useEffect } from "react";
import { useGameStore } from "@/lib/game/store";
import { Check, HelpCircle, MapPin } from "lucide-react";

export default function GuessBar() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const selectedCountry = useGameStore((s) => s.selectedCountry);
  const hoveredCountry = useGameStore((s) => s.hoveredCountry);
  const submitGuess = useGameStore((s) => s.submitGuess);

  // Keyboard shortcut: Press Enter to submit guess
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && selectedCountry && (gameStatus === "playing" || gameStatus === "guessing")) {
        submitGuess();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCountry, gameStatus, submitGuess]);

  if (gameStatus !== "playing" && gameStatus !== "guessing") {
    return null;
  }

  const activeCountry = selectedCountry || hoveredCountry;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-30 px-4 flex justify-center pointer-events-none">
      <div className="glass-panel p-2.5 sm:p-3 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto max-w-lg w-full flex items-center justify-between space-x-3 transition-all duration-300">
        {/* Country Information */}
        <div className="flex items-center space-x-3 min-w-0 pl-1">
          {activeCountry ? (
            <div className="flex items-center space-x-3 min-w-0">
              <span className="text-2xl sm:text-3xl flex-shrink-0 select-none">
                {activeCountry.flag}
              </span>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm sm:text-base font-bold text-white truncate">
                    {activeCountry.name}
                  </span>
                  {selectedCountry?.code === activeCountry.code && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeCountry.continent} • Lat: {activeCountry.lat}°, Lng: {activeCountry.lng}°
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-slate-400 py-1">
              <HelpCircle className="w-5 h-5 text-cyan-400/80 animate-pulse flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                Click any country on the globe to make your guess
              </span>
            </div>
          )}
        </div>

        {/* Submit Guess Button */}
        <div>
          {selectedCountry ? (
            <button
              onClick={submitGuess}
              className="group relative inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3] group-hover:scale-110 transition-transform" />
              <span>Lock Guess</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono font-normal">
                ↵
              </kbd>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-500 text-xs font-medium flex items-center space-x-1.5 select-none">
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Select Country</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
