import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// GET /api/departments - Get unique departments from users table
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this is a fallback authentication session
    const isFallbackAuth = (session.user as any).isFallbackAuth;
    if (isFallbackAuth) {
      return NextResponse.json([]);
    }

    // Get unique departments from users table using only 'department' field
    const departments = await prisma.user.groupBy({
      by: ['department'],
      where: {
        department: { not: null }
      },
      _count: {
        department: true
      },
      orderBy: {
        department: 'asc'
      }
    });

    // Transform the data to include user count and format properly
    const formattedDepartments = departments.map(dept => ({
      value: dept.department || '',
      label: dept.department || '',
      description: `${dept._count.department} users`,
      color: 'bg-blue-500', // Default color, could be enhanced with department-specific colors
      userCount: dept._count.department
    }));

    return NextResponse.json({
      departments: formattedDepartments,
      totalDepartments: formattedDepartments.length,
      totalUsers: formattedDepartments.reduce((sum, dept) => sum + dept.userCount, 0)
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
} 