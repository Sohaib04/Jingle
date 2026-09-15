"use client";

import React from "react";
import { useGameStore } from "@/lib/game/store";
import { GlobeViewMode } from "@/lib/game/types";
import {
  Satellite,
  Moon,
  Sparkles,
  Plus,
  Minus,
  Crosshair,
  RotateCw,
  Pause,
} from "lucide-react";

export default function GlobeControls() {
  const globeViewMode = useGameStore((s) => s.globeViewMode);
  const setGlobeViewMode = useGameStore((s) => s.setGlobeViewMode);
  const isAutoRotating = useGameStore((s) => s.isAutoRotating);
  const toggleAutoRotate = useGameStore((s) => s.toggleAutoRotate);
  const gameStatus = useGameStore((s) => s.gameStatus);

  const handleZoom = (delta: number) => {
    window.dispatchEvent(new CustomEvent("globe:zoom", { detail: { delta } }));
  };

  const handleRecenter = () => {
    window.dispatchEvent(new CustomEvent("globe:recenter"));
  };

  const viewModes: { id: GlobeViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "satellite", label: "Satellite", icon: Satellite },
    { id: "dark", label: "Obsidian", icon: Moon },
    { id: "night", label: "Night Lights", icon: Sparkles },
  ];

  return (
    <aside
      aria-label="Globe view controls"
      className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center space-y-2 pointer-events-auto select-none"
    >
      {/* View Mode Switcher Pill */}
      <div className="radio-pill p-1 rounded-2xl flex flex-col space-y-1 shadow-2xl border border-white/10 backdrop-blur-xl">
        {viewModes.map(({ id, label, icon: Icon }) => {
          const isActive = globeViewMode === id;
          return (
            <button
              key={id}
              onClick={() => setGlobeViewMode(id)}
              title={`${label} View`}
              aria-label={`Switch to ${label} view`}
              className={`relative p-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer group flex items-center justify-center ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />

              {/* Tooltip on desktop */}
              <span className="hidden md:group-hover:flex absolute right-full mr-2.5 px-2.5 py-1 rounded-lg bg-slate-900/90 text-slate-200 text-[11px] font-medium whitespace-nowrap border border-white/10 shadow-lg pointer-events-none items-center space-x-1">
                <span>{label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Camera Navigation Widget */}
      <div className="radio-pill p-1 rounded-2xl flex flex-col space-y-1 shadow-2xl border border-white/10 backdrop-blur-xl">
        {/* Zoom In */}
        <button
          onClick={() => handleZoom(-50)}
          title="Zoom In"
          aria-label="Zoom in on globe"
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer group flex items-center justify-center"
        >
          <Plus className="w-4 h-4 group-hover:scale-110" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => handleZoom(50)}
          title="Zoom Out"
          aria-label="Zoom out on globe"
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer group flex items-center justify-center"
        >
          <Minus className="w-4 h-4 group-hover:scale-110" />
        </button>

        {/* Re-center / North */}
        <button
          onClick={handleRecenter}
          title="Reset Camera"
          aria-label="Reset camera orientation"
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer group flex items-center justify-center"
        >
          <Crosshair className="w-4 h-4 group-hover:scale-110" />
        </button>

        {/* Toggle Auto Rotation */}
        {gameStatus === "idle" && (
          <button
            onClick={toggleAutoRotate}
            title={isAutoRotating ? "Pause Spin" : "Resume Spin"}
            aria-label={isAutoRotating ? "Pause globe spin" : "Resume globe spin"}
            className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer group flex items-center justify-center ${
              isAutoRotating
                ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {isAutoRotating ? (
              <Pause className="w-4 h-4 group-hover:scale-110" />
            ) : (
              <RotateCw className="w-4 h-4 group-hover:scale-110" />
            )}
          </button>
        )}
      </div>

      {/* Small telemetry label */}
      <div className="hidden sm:flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-500 tracking-wider uppercase border border-white/5 bg-slate-950/40">
        <span>{globeViewMode === "satellite" ? "SAT-1" : globeViewMode === "dark" ? "OBSIDIAN" : "NIGHT-HD"}</span>
      </div>
    </aside>
  );
}
