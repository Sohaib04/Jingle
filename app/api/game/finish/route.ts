import { NextResponse } from "next/server";
import { saveGameResult } from "@/lib/supabase/client";
import { GameSummary } from "@/lib/game/types";

export async function POST(request: Request) {
  try {
    const summary: GameSummary = await request.json();

    if (!summary || typeof summary.totalScore !== "number") {
      return NextResponse.json(
        { error: "Invalid game summary payload" },
        { status: 400 }
      );
    }

    await saveGameResult(summary);

    return NextResponse.json({
      success: true,
      gameId: summary.gameId,
      recordedScore: summary.totalScore,
    });
  } catch (error) {
    console.error("Error recording game finish:", error);
    return NextResponse.json(
      { error: "Failed to persist game summary" },
      { status: 500 }
    );
  }
}
