import { roomManager } from "@/lib/multiplayer/room-manager";
import { MultiplayerServerEvent } from "@/lib/multiplayer/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");

  if (!playerId) {
    return new Response("Missing playerId", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection ack
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "QUEUE_CONNECTED" })}\n\n`)
      );

      const listener = (event: MultiplayerServerEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          if (event.type === "MATCH_FOUND") {
            // Once match is found, close queue stream cleanly
            setTimeout(() => {
              try {
                controller.close();
              } catch {}
            }, 500);
          }
        } catch {
          // stream might be closed
        }
      };

      roomManager.subscribeQueue(playerId, listener);

      // Heartbeat ping interval
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        roomManager.leaveQueue(playerId);
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
