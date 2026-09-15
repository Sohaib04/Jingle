"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useGameStore } from "@/lib/game/store";
import { Check, HelpCircle, MapPin, Search, X } from "lucide-react";
import { getAllCountries, CountryMetadata } from "@/lib/geo/countries";

export default function GuessBar() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const selectedCountry = useGameStore((s) => s.selectedCountry);
  const hoveredCountry = useGameStore((s) => s.hoveredCountry);
  const submitGuess = useGameStore((s) => s.submitGuess);
  const selectCountry = useGameStore((s) => s.selectCountry);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const allCountries = useMemo(() => {
    return getAllCountries().sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return allCountries.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return allCountries
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.continent.toLowerCase().includes(q) ||
          c.code.toLowerCase() === q
      )
      .slice(0, 25);
  }, [allCountries, searchQuery]);

  // Keyboard shortcut: Press Enter to submit guess
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "Enter" &&
        selectedCountry &&
        !isSearchOpen &&
        (gameStatus === "playing" || gameStatus === "guessing")
      ) {
        submitGuess();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCountry, gameStatus, submitGuess, isSearchOpen]);

  if (gameStatus !== "playing" && gameStatus !== "guessing") {
    return null;
  }

  const activeCountry = selectedCountry || hoveredCountry;

  const handleSelectFromSearch = (country: CountryMetadata) => {
    selectCountry(country);
    setIsSearchOpen(false);
    setSearchQuery("");
    window.dispatchEvent(
      new CustomEvent("globe:fly-to", {
        detail: { lat: country.lat, lng: country.lng, altitude: 1.6 },
      })
    );
  };

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-30 px-3 sm:px-4 flex justify-center pointer-events-none safe-bottom">
        <div className="radio-panel p-2 sm:p-3 rounded-2xl border border-white/15 shadow-2xl pointer-events-auto max-w-xl w-full flex items-center justify-between gap-2 transition-all duration-300">
          {/* Country Information */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 pl-1 flex-1">
            {activeCountry ? (
              <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                <span className="text-2xl sm:text-3xl flex-shrink-0 select-none drop-shadow-md">
                  {activeCountry.flag}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs sm:text-base font-bold text-white truncate">
                      {activeCountry.name}
                    </span>
                    {selectedCountry?.code === activeCountry.code && (
                      <span className="text-[9px] sm:text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Target Set
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                    {activeCountry.continent} • {activeCountry.lat.toFixed(1)}°, {activeCountry.lng.toFixed(1)}°
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-slate-400 py-1">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">
                  Click globe or search to set coordinates
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            {/* Quick Country Search Modal Toggle (Essential for mobile touch) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              title="Search Country by Name"
              aria-label="Search country by name"
              className="p-2 sm:px-3 sm:py-2.5 rounded-xl radio-pill hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10 flex items-center space-x-1.5"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline text-xs font-medium">Search</span>
            </button>

            {/* Submit Guess Button */}
            {selectedCountry ? (
              <button
                onClick={submitGuess}
                className="group relative inline-flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3] group-hover:scale-110 transition-transform" />
                <span>Lock Signal</span>
                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono font-normal">
                  ↵
                </kbd>
              </button>
            ) : (
              <div className="px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-white/5 border border-white/5 text-slate-500 text-xs font-medium flex items-center space-x-1.5 select-none">
                <MapPin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Choose Target</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Country Search Modal for touchscreens and quick access */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="radio-panel max-w-md w-full rounded-3xl border border-white/15 p-4 sm:p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2 text-white">
                <Search className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold tracking-wide">Select Country</h3>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Type country name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400/50 transition-colors"
              />
            </div>

            {/* Country List */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleSelectFromSearch(c)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="text-xl flex-shrink-0">{c.flag}</span>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-white block truncate group-hover:text-emerald-300">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {c.continent}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 py-0.5 rounded bg-white/5">
                      {c.code}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No matching countries found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
