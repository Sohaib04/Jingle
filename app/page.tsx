import React from "react";
import Globe from "@/components/globe/Globe";
import GlobeControls from "@/components/globe/GlobeControls";
import GameHUD from "@/components/game/GameHUD";
import SongPlayer from "@/components/game/SongPlayer";
import GuessBar from "@/components/game/GuessBar";
import RoundResult from "@/components/game/RoundResult";
import FinalScore from "@/components/game/FinalScore";
import StartScreen from "@/components/game/StartScreen";

export default function HomePage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#05070b] select-none touch-none">
      {/* 3D Interactive Centerpiece Globe */}
      <div className="absolute inset-0 z-0">
        <Globe />
      </div>

      {/* Subtle Radio Garden Atmospheric Vignette & Horizon Glow */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(5,7,11,0.7)_100%)]" />

      {/* Floating Radio Garden Globe Controls (Satellite Switcher & Camera Zoom) */}
      <GlobeControls />

      {/* Game HUD (Top Bar) */}
      <GameHUD />

      {/* Radio Tuner / Mystery Song Player (Top Left) */}
      <SongPlayer />

      {/* Target Lock & Country Confirmation Bar (Bottom Center) */}
      <GuessBar />

      {/* Answer Reveal Telemetry Card */}
      <RoundResult />

      {/* Final 10-Round Session Report Screen */}
      <FinalScore />

      {/* Welcome / Idle Start Screen */}
      <StartScreen />
    </main>
  );
}
