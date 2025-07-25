import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Try to find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: username },
          { username: username },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ message: "err", content: "User not found" }, { status: 401 });
    }

    // For dev: compare plain text password
    if (user.hashedPassword !== password) {
      return NextResponse.json({ message: "err", content: "Invalid password" }, { status: 401 });
    }

    // Mock response structure expected by NextAuth logic
    return NextResponse.json({
      message: "OK",
      emp_code: user.username,
      emp_pos: user.role,
      emp_dept: user.department,
      emp_dept_name: user.departmentName,
      emp_name: user.name,
      email: user.email,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "err", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 }
    );
  }
} 