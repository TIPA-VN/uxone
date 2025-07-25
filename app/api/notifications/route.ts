import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendNotification } from "./stream/route";

export const runtime = 'nodejs'

// Removed unused User type

type DbUser = { id: string; username: string; } // Defined for broadcast user mapping

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 401 });
    }
    // Use raw query to fetch notifications
    const notifications = await prisma.$queryRawUnsafe(
      `SELECT * FROM notifications WHERE "userId" = '${session.user.id}' ORDER BY "createdAt" DESC`
    );
    // Filter out notifications without id
    const filtered = (notifications as Record<string, unknown>[]).filter((n) => n.id);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { broadcast = false, ...notificationData } = body;

    if (broadcast) {
      // Fetch all users
      const users = await prisma.$queryRawUnsafe<DbUser[]>(
        `SELECT id, username FROM users`
      );
      // Create notifications for all users
      const now = new Date();
      try {
        // Try using createMany (if available)
        await prisma.notification.createMany({
          data: users.map((user: DbUser) => ({
            userId: user.id,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type || 'broadcast',
            link: notificationData.link,
            read: false,
            createdAt: now,
          }))
        });
        // Fetch created notifications for SSE
        const createdNotifications = await prisma.$queryRawUnsafe(
          `SELECT * FROM notifications WHERE title = '${notificationData.title}' AND message = '${notificationData.message}' AND type = '${notificationData.type || 'broadcast'}' ORDER BY "createdAt" DESC LIMIT ${users.length}`
        );
        for (const notification of createdNotifications as Record<string, unknown>[]) {
          await sendNotification(notification, notification.userId as string);
        }
        return NextResponse.json({ count: users.length, notifications: (createdNotifications as Record<string, unknown>[]).length });
      } catch {
        // Fallback: use $transaction with multiple create calls
        await prisma.$transaction(
          users.map((user: DbUser) =>
            prisma.notification.create({
              data: {
                userId: user.id,
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type || 'broadcast',
                link: notificationData.link,
                read: false,
                createdAt: now,
              }
            })
          )
        );
        // Fetch created notifications for SSE
        const createdNotifications = await prisma.$queryRawUnsafe(
          `SELECT * FROM notifications WHERE title = '${notificationData.title}' AND message = '${notificationData.message}' AND type = '${notificationData.type || 'broadcast'}' ORDER BY "createdAt" DESC LIMIT ${users.length}`
        );
        for (const notification of createdNotifications as Record<string, unknown>[]) {
          await sendNotification(notification, notification.userId as string);
        }
        return NextResponse.json({ count: users.length, notifications: (createdNotifications as Record<string, unknown>[]).length });
      }
    } else {
      // Upsert user if not exists
      const sessionUserId = session.user.id;
      const sessionUsername = session.user.username || `user_${session.user.id}`;
      const sessionName = session.user.name || session.user.id;
      const sessionEmail = session.user.email || '';
      const sessionDepartment = session.user.department || '';
      const sessionDepartmentName = session.user.departmentName || '';
      const sessionRole = session.user.role || '';
      // Upsert user using raw SQL (ON CONFLICT)
      await prisma.$executeRawUnsafe(
        `INSERT INTO users (id, name, email, username, department, "departmentName", role, "hashedPassword", "createdAt", "updatedAt") VALUES ('${sessionUserId}', '${sessionName}', '${sessionEmail}', '${sessionUsername}', '${sessionDepartment}', '${sessionDepartmentName}', '${sessionRole}', '', NOW(), NOW()) ON CONFLICT (id) DO NOTHING`
      );
      // Insert notification using Prisma ORM
      const now = new Date();
      const notification = await prisma.notification.create({
        data: {
          userId: sessionUserId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'notification',
          link: notificationData.link,
          read: false,
          createdAt: now,
        }
      });
      await sendNotification(notification, sessionUserId);
      return NextResponse.json(notification);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 });
    }
    // Verify notification ownership
    const existing = await prisma.$queryRawUnsafe(
      `SELECT * FROM notifications WHERE id = '${body.id}' AND "userId" = '${session.user.id}' LIMIT 1`
    );
    if (!existing || (Array.isArray(existing) && existing.length === 0)) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    // Update notification as read
    const updated = await prisma.$queryRawUnsafe(
      `UPDATE notifications SET read = true WHERE id = '${body.id}' RETURNING *`
    );
    const notification = Array.isArray(updated) ? updated[0] : updated;
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
} 