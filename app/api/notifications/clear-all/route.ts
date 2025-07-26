import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs'

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all notifications for the current user
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM notifications WHERE "userId" = '${session.user.id}'`
    );

    return NextResponse.json({ 
      success: true, 
      message: "All notifications cleared",
      deletedCount: result 
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
  }
} 