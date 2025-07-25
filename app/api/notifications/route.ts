import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendNotification } from "./stream/route";

// GET: Fetch notifications for current user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(notifications);
}

// POST: Create a notification (for testing/admin)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { title, message, link, type, userId, broadcast } = await req.json();
  // Allow admin to send to any user, otherwise only self
  const targetUserId = session.user.role === "ADMIN" && userId ? userId : session.user.id;
  const notification = await prisma.notification.create({
    data: {
      userId: targetUserId,
      title,
      message,
      link,
      type,
    },
  });
  // Real-time: broadcast or user-specific
  if (broadcast && session.user.role === "ADMIN") {
    sendNotification(notification); // broadcast to all
  } else {
    sendNotification(notification, targetUserId);
  }
  return NextResponse.json(notification);
}

// PATCH: Mark notification as read
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  const notification = await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
  return NextResponse.json({ success: true, count: notification.count });
} 