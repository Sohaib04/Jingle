import { roomManager } from "@/lib/multiplayer/room-manager";
import { MultiplayerServerEvent } from "@/lib/multiplayer/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await props.params;
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");

  if (!roomId || !playerId) {
    return new Response("Missing roomId or playerId", { status: 400 });
  }

  const room = roomManager.getRoom(roomId);
  if (!room) {
    return new Response("Room not found or expired", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection and room snapshot
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "ROOM_CONNECTED",
            roomId,
            roomState: room.state,
            roundIndex: room.roundIndex,
            totalRounds: room.totalRounds,
            player1: room.player1,
            player2: room.player2,
          })}\n\n`
        )
      );

      const listener = (event: MultiplayerServerEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // stream might be closed
        }
      };

      const unsubscribe = roomManager.subscribeRoom(roomId, playerId, listener);

      // Keepalive ping
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
