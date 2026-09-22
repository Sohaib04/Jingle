import { NextResponse } from "next/server";
import { defaultMusicProvider } from "@/lib/music/itunes-provider";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const difficulty = body.difficulty || "easy";
    const requestedCount = Number(body.roundsCount);
    const roundsCount = Number.isInteger(requestedCount)
      ? Math.max(1, Math.min(10, requestedCount))
      : 5;

    const tracks = await defaultMusicProvider.getTracksForGame(roundsCount, difficulty);

    return NextResponse.json({
      gameId: `gt-${Date.now()}`,
      rounds: tracks,
      durationPerRound: 20,
      totalRounds: roundsCount,
    });
  } catch (error) {
    console.error("Error starting game session:", error);
    return NextResponse.json(
      { error: "Failed to initialize game session" },
      { status: 500 }
    );
  }
}
