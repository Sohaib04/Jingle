import React from "react";
import Globe from "@/components/globe/Globe";
import GameHUD from "@/components/game/GameHUD";
import SongPlayer from "@/components/game/SongPlayer";
import GuessBar from "@/components/game/GuessBar";
import RoundResult from "@/components/game/RoundResult";
import FinalScore from "@/components/game/FinalScore";
import StartScreen from "@/components/game/StartScreen";

export default function HomePage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#08090d] select-none">
      {/* 3D Interactive Centerpiece Globe */}
      <div className="absolute inset-0 z-0">
        <Globe />
      </div>

      {/* Subtle atmospheric vignette */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-radial-gradient from-transparent via-transparent to-[#08090d]/60" />

      {/* Game HUD (Top Bar) */}
      <GameHUD />

      {/* Mystery Song Player / Equalizer (Top Left) */}
      <SongPlayer />

      {/* Guess Bar / Country Confirmation (Bottom Center) */}
      <GuessBar />

      {/* Answer Reveal Card */}
      <RoundResult />

      {/* Final 10-Round Score Screen */}
      <FinalScore />

      {/* Welcome / Idle Start Screen */}
      <StartScreen />
    </main>
  );
}
