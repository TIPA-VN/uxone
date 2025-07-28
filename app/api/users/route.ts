import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// GET /api/users - Get all users with pagination
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || ""; // active, inactive, all

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { centralDepartment: { contains: search, mode: 'insensitive' } },
        { departmentName: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalUsers / limit);

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        department: true,
        centralDepartment: true,
        departmentName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { isActive: "desc" },
        { createdAt: "desc" }
      ],
      skip,
      take: limit,
    });

    return NextResponse.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// PATCH /api/users - Update user status (enable/disable)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this is a fallback authentication session
    const isFallbackAuth = (session.user as any).isFallbackAuth;
    if (isFallbackAuth) {
      return NextResponse.json({ error: "Database unavailable in fallback mode" }, { status: 503 });
    }

    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        department: true,
        departmentName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
} 