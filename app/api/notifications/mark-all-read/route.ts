import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs'

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark all unread notifications as read for the current user
    const result = await prisma.$executeRawUnsafe(
      `UPDATE notifications SET read = true WHERE "userId" = '${session.user.id}' AND read = false AND hidden = false`
    );

    return NextResponse.json({ 
      success: true, 
      message: "All notifications marked as read",
      updatedCount: result 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
} 