"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useMultiplayerStore } from "@/lib/multiplayer/store";
import { Check, HelpCircle, MapPin, Search, X, Loader2 } from "lucide-react";
import { getAllCountries, CountryMetadata } from "@/lib/geo/countries";

export default function BattleGuessBar() {
  const status = useMultiplayerStore((s) => s.status);
  const selectedCountry = useMultiplayerStore((s) => s.selectedCountry);
  const hoveredCountry = useMultiplayerStore((s) => s.hoveredCountry);
  const hasLockedIn = useMultiplayerStore((s) => s.hasLockedIn);
  const opponentHasLockedIn = useMultiplayerStore((s) => s.opponentHasLockedIn);
  const selectCountry = useMultiplayerStore((s) => s.selectCountry);
  const lockGuess = useMultiplayerStore((s) => s.lockGuess);

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

  // Keyboard shortcut: Press Enter to lock guess
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "Enter" &&
        selectedCountry &&
        !hasLockedIn &&
        !isSearchOpen &&
        status === "roundActive"
      ) {
        lockGuess();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCountry, hasLockedIn, status, lockGuess, isSearchOpen]);

  if (status !== "roundActive") {
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
          {/* Selected Country Details */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 pl-1 flex-1">
            {activeCountry ? (
              <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                <span className="text-2xl sm:text-3xl flex-shrink-0 select-none drop-shadow-md">
                  {activeCountry.flag}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-white font-bold text-sm sm:text-base truncate tracking-tight">
                      {activeCountry.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                      {activeCountry.code}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {activeCountry.continent} • {selectedCountry ? "Target Selected" : "Hovering"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-slate-400 py-1">
                <MapPin className="w-5 h-5 text-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">
                  Click a country on the Earth or search by name
                </span>
              </div>
            )}
          </div>

          {/* Action Area: Search & Lock-In Button */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {!hasLockedIn && (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                title="Search country by name"
                className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {hasLockedIn ? (
              <div className="py-2.5 px-4 sm:px-5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-lg shadow-emerald-500/10 animate-pulse">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{opponentHasLockedIn ? "Resolving..." : "Waiting for Opponent..."}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={lockGuess}
                disabled={!selectedCountry}
                className={`py-2.5 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer ${
                  selectedCountry
                    ? "bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 hover:opacity-95 text-white shadow-lg shadow-rose-500/25 active:scale-[0.98]"
                    : "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                }`}
              >
                <span>LOCK GUESS</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Country Search Drawer Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="radio-panel max-w-md w-full rounded-3xl border border-white/15 p-4 sm:p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Select Target Country</span>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by country or continent..."
              className="w-full py-2 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50"
            />

            <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleSelectFromSearch(c)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.08] text-left transition cursor-pointer text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">{c.flag}</span>
                    <span className="text-white font-medium">{c.name}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">{c.continent}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
