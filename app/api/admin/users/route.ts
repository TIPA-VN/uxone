import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessPage } from '@/config/app';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role as keyof typeof import('@/config/app').APP_CONFIG.roles;
    
    if (!canAccessPage(userRole, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Calculate user statistics
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.role !== null).length;
    const inactiveUsers = users.filter(user => user.role === null).length;
    const recentUsers = users.filter(user => {
      const userDate = new Date(user.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return userDate > thirtyDaysAgo;
    }).length;

    return NextResponse.json({
      users,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        recentUsers,
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
