import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a manager (ADMIN, SENIOR MANAGER, or MANAGER)
    const isManager = ["ADMIN", "SENIOR MANAGER", "MANAGER"].includes(session.user.role?.toUpperCase() || "");
    if (!isManager) {
      return NextResponse.json({ error: "Access denied. Manager role required." }, { status: 403 });
    }

    // Get all users with their task and project statistics
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        department: true,
        departmentName: true,
        role: true,
        _count: {
          select: {
            projects: true,
            assignedTasks: true,
          },
        },
      },
    });

    // Calculate detailed statistics for each user
    const teamMembers = await Promise.all(
      users.map(async (user) => {
        // Get task statistics
        const taskStats = await prisma.task.groupBy({
          by: ["status"],
          where: { assigneeId: user.id },
          _count: { id: true },
        });

        const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.id, 0);
        const completedTasks = taskStats.find(stat => stat.status === "COMPLETED")?._count.id || 0;
        const inProgressTasks = taskStats.find(stat => stat.status === "IN_PROGRESS")?._count.id || 0;
        const overdueTasks = await prisma.task.count({
          where: {
            assigneeId: user.id,
            dueDate: { lt: new Date() },
            status: { not: "COMPLETED" },
          },
        });

        const taskEfficiency = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Get project statistics
        const projectStats = await prisma.project.groupBy({
          by: ["status"],
          where: { ownerId: user.id },
          _count: { id: true },
        });

        const totalProjects = projectStats.reduce((sum, stat) => sum + stat._count.id, 0);
        const completedProjects = projectStats.find(stat => stat.status === "COMPLETED")?._count.id || 0;
        const activeProjects = projectStats.find(stat => stat.status === "ACTIVE")?._count.id || 0;

        const projectEfficiency = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          department: user.department,
          departmentName: user.departmentName,
          role: user.role,
          taskStats: {
            total: totalTasks,
            completed: completedTasks,
            inProgress: inProgressTasks,
            overdue: overdueTasks,
            efficiency: taskEfficiency,
          },
          projectStats: {
            total: totalProjects,
            completed: completedProjects,
            active: activeProjects,
            efficiency: projectEfficiency,
          },
        };
      })
    );

    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
} 