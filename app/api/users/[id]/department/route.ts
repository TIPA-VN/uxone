import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDepartmentCodes } from "@/config/app";

export const runtime = 'nodejs';

// PATCH /api/users/[id]/department - Update user's local department
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { department } = await request.json();

    if (!department) {
      return NextResponse.json(
        { error: "Department is required" },
        { status: 400 }
      );
    }

    // Validate department code
    const departmentCodes = getDepartmentCodes();
    const validDepartments = Object.keys(departmentCodes);
    
    if (!validDepartments.includes(department)) {
      return NextResponse.json(
        { error: "Invalid department code" },
        { status: 400 }
      );
    }

    // Update the user's local department (not central department)
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { department },
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
    });

    return NextResponse.json({
      message: "User department updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user department:", error);
    return NextResponse.json(
      { error: "Failed to update user department" },
      { status: 500 }
    );
  }
}

// GET /api/users/[id]/department - Get user's department information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions or is viewing their own data
    if (session.user.role !== 'ADMIN' && session.user.id !== params.id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user department:", error);
    return NextResponse.json(
      { error: "Failed to fetch user department" },
      { status: 500 }
    );
  }
} 