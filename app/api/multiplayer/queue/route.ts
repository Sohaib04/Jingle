import { NextResponse } from "next/server";
import { roomManager } from "@/lib/multiplayer/room-manager";
import { Difficulty } from "@/lib/game/types";
import { MultiplayerPlayer } from "@/lib/multiplayer/types";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const playerName = (body.name || "SonicPilot").trim().slice(0, 24);
    const difficulty: Difficulty = body.difficulty || "easy";
    const playerId = body.playerId || `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const player: MultiplayerPlayer = {
      id: playerId,
      name: playerName,
      avatar: body.avatar || "🎧",
      score: 0,
      roundsWon: 0,
      streak: 0,
      isConnected: true,
      lastHeartbeat: Date.now(),
      hasLockedIn: false,
    };

    const result = roomManager.joinQueue(player, difficulty);

    return NextResponse.json({
      status: result.status,
      player,
      roomId: result.room?.id || null,
      difficulty,
    });
  } catch (error) {
    console.error("Error in matchmaking queue:", error);
    return NextResponse.json(
      { error: "Matchmaking queue failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");
    if (playerId) {
      roomManager.leaveQueue(playerId);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving matchmaking queue:", error);
    return NextResponse.json({ error: "Failed to leave queue" }, { status: 500 });
  }
}
