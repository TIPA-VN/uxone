import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Debug session information
    const sessionInfo = {
      userId: session.user.id,
      username: session.user.username,
      department: session.user.department,
      centralDepartment: session.user.centralDepartment,
      role: session.user.role,
      isFallbackAuth: (session.user as any).isFallbackAuth
    };

    // Test the exact filtering logic
    const whereClause = {
      OR: [
        { assignee: { department: session.user.department } },
        { owner: { department: session.user.department } },
        { creator: { department: session.user.department } },
        { project: { departments: { has: session.user.department } } }
      ]
    };

    // Test tasks query
    const tasksResult = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        status: true,
        assignee: { select: { department: true, name: true } },
        owner: { select: { department: true, name: true } },
        creator: { select: { department: true, name: true } },
        project: { select: { departments: true, name: true } }
      }
    });

    // Test projects query
    const projectsResult = await prisma.project.findMany({
      where: {
        OR: [
          { departments: { has: session.user.department } },
          { owner: { department: session.user.department } },
          { members: { some: { user: { department: session.user.department } } } }
        ]
      },
      select: {
        id: true,
        name: true,
        status: true,
        departments: true,
        owner: { select: { department: true, name: true } }
      }
    });

    return NextResponse.json({
      sessionInfo,
      whereClause,
      tasksQuery: {
        count: tasksResult.length,
        results: tasksResult
      },
      projectsQuery: {
        count: projectsResult.length,
        results: projectsResult
      }
    });

  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
