import { NextResponse } from "next/server";
import { roomManager } from "@/lib/multiplayer/room-manager";
import { MultiplayerClientAction } from "@/lib/multiplayer/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await props.params;
    const body: MultiplayerClientAction = await request.json();

    if (!roomId || !body || !body.playerId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const room = roomManager.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    switch (body.type) {
      case "HEARTBEAT": {
        const ok = roomManager.heartbeat(roomId, body.playerId);
        return NextResponse.json({ success: ok });
      }

      case "SUBMIT_GUESS": {
        const ok = roomManager.submitGuess(
          roomId,
          body.playerId,
          body.countryCode,
          body.responseTimeSeconds
        );
        return NextResponse.json({ success: ok });
      }

      case "FORFEIT": {
        roomManager.forfeit(roomId, body.playerId);
        return NextResponse.json({ success: true, forfeited: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing multiplayer action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
