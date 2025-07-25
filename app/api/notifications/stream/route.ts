import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Store all SSE connections
const clients: { userId: string | null; res: any }[] = [];

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id || null;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const res = {
        write: (data: string) => controller.enqueue(encoder.encode(data)),
        close: () => controller.close(),
      };
      clients.push({ userId, res });
      // Remove on close
      req.signal.addEventListener("abort", () => {
        const idx = clients.findIndex((c) => c.res === res);
        if (idx !== -1) clients.splice(idx, 1);
        res.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// Helper to send notification to all or specific user
export function sendNotification(notification: any, userId?: string) {
  const data = `data: ${JSON.stringify(notification)}\n\n`;
  if (userId) {
    clients.filter((c) => c.userId === userId).forEach((c) => c.res.write(data));
  } else {
    clients.forEach((c) => c.res.write(data));
  }
} 