import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/kpi - Get comprehensive KPI data for dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const timeRange = searchParams.get("timeRange") || "30"; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Base where conditions for user's data
    const userWhere = {
      OR: [
        { ownerId: session.user.id },
        { assigneeId: session.user.id },
        { creatorId: session.user.id },
      ],
    };

    const projectWhere = {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
        { departments: { has: session.user.department } },
      ],
    };

    // Task Statistics
    const taskStats = await prisma.task.groupBy({
      by: ["status"],
      where: {
        ...userWhere,
        ...(projectId && { projectId }),
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    });

    // Project Statistics
    const projectStats = await prisma.project.groupBy({
      by: ["status"],
      where: {
        ...projectWhere,
        ...(projectId && { id: projectId }),
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    });

    // Recent Activity
    const recentTasks = await prisma.task.findMany({
      where: {
        ...userWhere,
        ...(projectId && { projectId }),
        updatedAt: { gte: startDate },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    const recentComments = await prisma.comment.findMany({
      where: {
        authorId: session.user.id,
        createdAt: { gte: startDate },
        ...(projectId && { taskId: { not: null } }), // Only include comments on tasks if projectId is specified
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Time Tracking Summary
    const timeTracking = await prisma.task.aggregate({
      where: {
        ...userWhere,
        ...(projectId && { projectId }),
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    });

    // Overdue Tasks
    const overdueTasks = await prisma.task.count({
      where: {
        ...userWhere,
        ...(projectId && { projectId }),
        dueDate: { lt: new Date() },
        status: { not: "COMPLETED" },
      },
    });

    // Upcoming Deadlines (next 7 days)
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        ...userWhere,
        ...(projectId && { projectId }),
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        status: { not: "COMPLETED" },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    // Calculate metrics
    const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const completedTasks = taskStats.find(stat => stat.status === "COMPLETED")?._count.id || 0;
    const inProgressTasks = taskStats.find(stat => stat.status === "IN_PROGRESS")?._count.id || 0;
    const reviewTasks = taskStats.find(stat => stat.status === "REVIEW")?._count.id || 0;
    const todoTasks = taskStats.find(stat => stat.status === "TODO")?._count.id || 0;

    const totalProjects = projectStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const activeProjects = projectStats.find(stat => stat.status === "ACTIVE")?._count.id || 0;
    const completedProjects = projectStats.find(stat => stat.status === "COMPLETED")?._count.id || 0;

    // Time tracking fields removed as estimatedHours and actualHours don't exist in current schema
    const totalEstimatedHours = 0;
    const totalActualHours = 0;
    const efficiency = 0;

    // Productivity trends (last 7 days)
    const productivityTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayTasks = await prisma.task.count({
        where: {
          ...userWhere,
          ...(projectId && { projectId }),
          status: "COMPLETED",
          updatedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      productivityTrends.push({
        date: dayStart.toISOString().split('T')[0],
        completedTasks: dayTasks,
      });
    }

    const kpiData = {
      overview: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks: reviewTasks, // Changed from blockedTasks to reviewTasks
        todoTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        totalProjects,
        activeProjects,
        completedProjects,
        overdueTasks,
        upcomingDeadlines: upcomingDeadlines.length,
      },
      timeTracking: {
        totalEstimatedHours,
        totalActualHours,
        efficiency,
        hoursLogged: totalActualHours,
        hoursRemaining: Math.max(0, totalEstimatedHours - totalActualHours),
      },
      productivity: {
        trends: productivityTrends,
        averageDailyTasks: productivityTrends.reduce((sum, day) => sum + day.completedTasks, 0) / 7,
      },
      recentActivity: {
        tasks: recentTasks,
        comments: recentComments,
      },
      upcomingDeadlines,
    };

    return NextResponse.json(kpiData);
  } catch (error) {
    console.error("Error fetching KPI data:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPI data" },
      { status: 500 }
    );
  }
} 