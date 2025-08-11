import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Define a type for the response writer
interface ResponseWriter {
  write: (data: string) => void;
  close: () => void;
}

// Store all SSE connections
const clients: { userId: string | null; res: ResponseWriter }[] = [];

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    if (!session?.user) {
      console.error('SSE: Unauthenticated user attempt to connect');
      return new Response('Unauthorized', { status: 401 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const res: ResponseWriter = {
          write: (data: string) => {
            try {
              controller.enqueue(encoder.encode(data));
            } catch (error) {
              console.error('Stream write error:', error);
            }
          },
          close: () => {
            try {
              controller.close();
            } catch (error) {
              console.error('Stream close error:', error);
            }
          },
        };

        // Add client to list
        clients.push({ userId, res });

        // Send initial heartbeat
        res.write('data: {"type":"heartbeat"}\n\n');

        // Remove on close
        req.signal.addEventListener("abort", () => {
          const idx = clients.findIndex((c) => c.res === res);
          if (idx !== -1) {
            clients.splice(idx, 1);
          }
          res.close();
        });

        // Heartbeat every 30s to keep connection alive
        const heartbeat = setInterval(() => {
          if (clients.findIndex((c) => c.res === res) !== -1) {
            res.write('data: {"type":"heartbeat"}\n\n');
          } else {
            clearInterval(heartbeat);
          }
        }, 30000);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error('SSE: Error in stream endpoint:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Helper to send notification to all or specific user
export function sendNotification(notification: Record<string, unknown>, userId?: string) {
  try {
    const notifData = {
      ...notification,
      type: notification.type || 'notification'
    };

    const data = `data: ${JSON.stringify(notifData)}\n\n`;
    
    if (userId) {
      // Send to specific user
      const userClients = clients.filter(c => c.userId === userId);

      userClients.forEach(c => {
        try {
          c.res.write(data);
        } catch (error) {
          console.error(`Failed to send to client: ${userId}`, error);
        }
      });
    } else {
      // Broadcast to all
      clients.forEach(c => {
        try {
          c.res.write(data);
        } catch (error) {
          console.error(`Failed to broadcast to client: ${c.userId}`, error);
        }
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
} 