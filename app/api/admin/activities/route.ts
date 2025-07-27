import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// GET /api/admin/activities - Get recent activities
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
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get recent user activities from multiple sources
    const activities = [];

    // 1. Recent user logins (from user updatedAt)
    const recentUsers = await prisma.user.findMany({
      select: {
        username: true,
        name: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    recentUsers.forEach(user => {
      activities.push({
        id: `login-${user.username}`,
        type: 'login',
        message: `${user.name || user.username} logged in`,
        timestamp: user.updatedAt,
        icon: 'user',
        color: 'green'
      });
    });

    // 2. Recent project activities
    const recentProjects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 3
    });

    recentProjects.forEach(project => {
      activities.push({
        id: `project-${project.id}`,
        type: 'project',
        message: `Project "${project.name}" ${project.status.toLowerCase()}`,
        timestamp: project.updatedAt,
        icon: 'file',
        color: 'blue',
        details: `by ${project.owner?.name || project.owner?.username}`
      });
    });

    // 3. Recent task activities
    const recentTasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        assignee: {
          select: {
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 3
    });

    recentTasks.forEach(task => {
      activities.push({
        id: `task-${task.id}`,
        type: 'task',
        message: `Task "${task.title}" ${task.status.toLowerCase()}`,
        timestamp: task.updatedAt,
        icon: 'check',
        color: 'orange',
        details: `assigned to ${task.assignee?.name || task.assignee?.username}`
      });
    });

    // 4. System activities (user status changes, etc.)
    const inactiveUsers = await prisma.user.count({
      where: {
        isActive: false
      }
    });

    if (inactiveUsers > 0) {
      activities.push({
        id: 'system-inactive-users',
        type: 'system',
        message: `${inactiveUsers} inactive user${inactiveUsers > 1 ? 's' : ''} found`,
        timestamp: new Date(),
        icon: 'alert',
        color: 'red'
      });
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return only the requested number of activities
    return NextResponse.json({
      activities: activities.slice(0, limit),
      totalActivities: activities.length
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
} 