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

    // Calculate detailed statistics for each user
    const teamMembers = await Promise.all(
      users.map(async (user: any) => {
        // Get task statistics
        const taskStats = await prisma.task.groupBy({
          by: ["status"],
          where: { assigneeId: user.id },
          _count: { id: true },
        });

        const totalTasks = taskStats.reduce((sum: number, stat: any) => sum + stat._count.id, 0);
        const completedTasks = taskStats.find((stat: any) => stat.status === "COMPLETED")?._count.id || 0;
        const inProgressTasks = taskStats.find((stat: any) => stat.status === "IN_PROGRESS")?._count.id || 0;
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

        const totalProjects = projectStats.reduce((sum: number, stat: any) => sum + stat._count.id, 0);
        const completedProjects = projectStats.find((stat: any) => stat.status === "COMPLETED")?._count.id || 0;
        const activeProjects = projectStats.find((stat: any) => stat.status === "ACTIVE")?._count.id || 0;

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