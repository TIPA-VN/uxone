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
    // Check if this is a test request
    const url = new URL(req.url);
    if (url.searchParams.get('test') === 'true') {
      console.log('SSE: Test connection request');
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"type":"test","message":"SSE connection working"}\n\n'));
          setTimeout(() => controller.close(), 1000);
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
    }

    const session = await auth();
    const userId = session?.user?.id || null;

    if (!session?.user) {
      console.error('SSE: Unauthenticated user attempt to connect');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log(`SSE: User ${userId} (${session.user.username}) connecting to stream`);

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
        console.log(`SSE: Client ${userId} added, total clients: ${clients.length}`);

        // Send initial heartbeat
        res.write('data: {"type":"heartbeat"}\n\n');

        // Remove on close
        req.signal.addEventListener("abort", () => {
          const idx = clients.findIndex((c) => c.res === res);
          if (idx !== -1) {
            clients.splice(idx, 1);
            console.log(`SSE: Client ${userId} disconnected, remaining clients: ${clients.length}`);
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