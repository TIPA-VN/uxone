import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFeature, mapUserDepartmentToCode } from "@/config/app";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has team management access using centralized RBAC
    const hasTeamAccess = canAccessFeature(session.user.role as any, "teamManagement");
    if (!hasTeamAccess) {
      return NextResponse.json({ error: "Access denied. Team management access required." }, { status: 403 });
    }

    // Determine user's permission level
    const isManagerOrAbove = [
      "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
      "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
      "MANAGER", "MANAGER_2"
    ].includes(session.user.role);

    // Map the user's department to the standardized code
    const userDepartmentCode = mapUserDepartmentToCode(session.user.department || 'OPS');
    
    // IS department can see IS and Helpdesk teams, other departments can only see their own
    const whereClause = userDepartmentCode === 'IS' ? {
      OR: [
        { department: 'IS' },
        { department: 'HELPDESK' } // Helpdesk department
      ],
      isActive: true
    } : {
      department: userDepartmentCode,
      isActive: true
    };

    // Get users from the same department with their task and project statistics
    const users = await prisma.user.findMany({
      where: whereClause,
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

    // Get all task statistics in bulk for better performance
    const allTaskStats = await prisma.task.groupBy({
      by: ["assigneeId", "status"],
      where: { assigneeId: { in: users.map(u => u.id) } },
      _count: { id: true },
    });

    // Get all overdue task counts in bulk
    const overdueTaskCounts = await prisma.task.groupBy({
      by: ["assigneeId"],
      where: {
        assigneeId: { in: users.map(u => u.id) },
        dueDate: { lt: new Date() },
        status: { not: "COMPLETED" },
      },
      _count: { id: true },
    });

    // Get all project statistics in bulk
    const allProjectStats = await prisma.project.groupBy({
      by: ["ownerId", "status"],
      where: { ownerId: { in: users.map(u => u.id) } },
      _count: { id: true },
    });

    // Calculate detailed statistics for each user
    const teamMembers = users.map((user: any) => {
      // Get task statistics for this user
      const userTaskStats = allTaskStats.filter(stat => stat.assigneeId === user.id);
      const totalTasks = userTaskStats.reduce((sum: number, stat: any) => sum + stat._count.id, 0);
      const completedTasks = userTaskStats.find((stat: any) => stat.status === "COMPLETED")?._count.id || 0;
      const inProgressTasks = userTaskStats.find((stat: any) => stat.status === "IN_PROGRESS")?._count.id || 0;
      
      // Get overdue tasks count for this user
      const overdueTasks = overdueTaskCounts.find(stat => stat.assigneeId === user.id)?._count.id || 0;
      
      const taskEfficiency = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Get project statistics for this user
      const userProjectStats = allProjectStats.filter(stat => stat.ownerId === user.id);
      const totalProjects = userProjectStats.reduce((sum: number, stat: any) => sum + stat._count.id, 0);
      const completedProjects = userProjectStats.find((stat: any) => stat.status === "COMPLETED")?._count.id || 0;
      const activeProjects = userProjectStats.find((stat: any) => stat.status === "ACTIVE")?._count.id || 0;

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
        // Add permission information
        permissions: {
          canEdit: isManagerOrAbove,
          canDelete: isManagerOrAbove,
          canView: true, // All team members can view
        },
      };
    });

    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
} 