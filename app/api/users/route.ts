import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 401 });
    }

    // Get all users with basic information
    const users = await prisma.$queryRawUnsafe(`
      SELECT id, name, username, email, department, "departmentName", role
      FROM users
      ORDER BY name, username
    `);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json([], { status: 500 });
  }
} 