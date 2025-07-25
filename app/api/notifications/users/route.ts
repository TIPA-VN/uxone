import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// Force Node.js runtime for Prisma
export const runtime = 'nodejs'

type User = {
  id: string;
  name: string | null;
  username: string;
  department: string | null;
  departmentName: string | null;
  position: string | null;
}

type NotificationCount = {
  userId: string;
  _count: number;
}

type RawNotificationCount = {
  userId: string;
  _count: number | bigint;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 401 });
    }

    // Get users and notification counts separately
    const [users, notificationCounts] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          department: true,
          departmentName: true,
          // position removed
        },
        orderBy: { name: 'asc' }
      }) as Promise<User[]>,
      prisma.$queryRaw(
        Prisma.sql`
          SELECT 
            "userId", 
            CAST(COUNT(*) AS INTEGER) as "_count"
          FROM notifications
          GROUP BY "userId"
        `
      ).then((rows =>
        (rows as RawNotificationCount[]).map(row => ({ ...row, _count: Number(row._count) }))
      ))
    ]);

    // Map counts to users
    const usersWithCounts = users.map((user: User) => ({
      ...user,
      notificationCount: notificationCounts.find(
        (count: NotificationCount) => count.userId === user.id
      )?._count ?? 0
    }));

    return NextResponse.json(usersWithCounts);
  } catch (error) {
    console.error('Error fetching users:', error);
    // Always return an array, even on error
    return NextResponse.json([], { status: 500 });
  }
} 