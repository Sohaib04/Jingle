import React from "react";
import Globe from "@/components/globe/Globe";
import GlobeControls from "@/components/globe/GlobeControls";
import GameHUD from "@/components/game/GameHUD";
import SongPlayer from "@/components/game/SongPlayer";
import GuessBar from "@/components/game/GuessBar";
import RoundResult from "@/components/game/RoundResult";
import FinalScore from "@/components/game/FinalScore";
import StartScreen from "@/components/game/StartScreen";
import MatchmakingModal from "@/components/multiplayer/MatchmakingModal";
import BattleHUD from "@/components/multiplayer/BattleHUD";
import BattleGuessBar from "@/components/multiplayer/BattleGuessBar";
import BattleRoundResult from "@/components/multiplayer/BattleRoundResult";
import BattleFinalScore from "@/components/multiplayer/BattleFinalScore";

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

      {/* Solo Mode HUD (Top Bar) */}
      <GameHUD />

      {/* 1v1 Battle Mode HUD (Top Bar with Head-to-Head Duel Status) */}
      <BattleHUD />

      {/* Radio Tuner / Mystery Song Player (Top Left) */}
      <SongPlayer />

      {/* Solo Mode: Target Lock & Country Confirmation Bar (Bottom Center) */}
      <GuessBar />

      {/* 1v1 Battle Mode: Target Lock & Duel Action Bar (Bottom Center) */}
      <BattleGuessBar />

      {/* Solo Answer Reveal Telemetry Card */}
      <RoundResult />

      {/* 1v1 Battle Round Outcome & Head-to-Head Duel Card */}
      <BattleRoundResult />

      {/* Solo 10-Round Session Report Screen */}
      <FinalScore />

      {/* 1v1 Battle 10-Round Match Victory / Defeat Screen */}
      <BattleFinalScore />

      {/* 1v1 Multiplayer Matchmaking Lobby Modal */}
      <MatchmakingModal />

      {/* Welcome / Idle Start Screen */}
      <StartScreen />
    </main>
  );
}
