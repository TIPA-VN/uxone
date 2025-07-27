import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects - Get all projects with enhanced filtering and KPI data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this is a fallback authentication session
    const isFallbackAuth = (session.user as any).isFallbackAuth;
    
    // If using fallback auth and database is likely down, return empty array
    if (isFallbackAuth) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const ownerId = searchParams.get("ownerId");
    const memberId = searchParams.get("memberId");
    const includeTasks = searchParams.get("includeTasks") === "true";
    const includeMembers = searchParams.get("includeMembers") === "true";
    const includeKPI = searchParams.get("includeKPI") === "true";

    const where: any = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by owner
    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Filter by team member
    if (memberId) {
      where.members = {
        some: {
          userId: memberId,
        },
      };
    }

    const include: any = {
      owner: {
        select: {
          id: true,
          name: true,
          username: true,
          department: true,
          departmentName: true,
        },
      },
              _count: {
          select: {
            tasks: true,
            documents: true,
            comments: true,
            members: true,
          },
        },
    };

    // Include tasks if requested
    if (includeTasks) {
      include.tasks = {
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              username: true,
              department: true,
              departmentName: true,
            },
          },
          _count: {
            select: {
              subtasks: true,
              comments: true,
            },
          },
        },
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
      };
    }

    // Include team members if requested
    if (includeMembers) {
      include.members = {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              department: true,
              departmentName: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      };
    }

    const projects = await prisma.project.findMany({
      where,
      include,
      orderBy: [
        { status: "asc" },
        { startDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Add completed task counts to each project
    const projectsWithTaskCounts = await Promise.all(
      projects.map(async (project) => {
        const completedTasksCount = await prisma.task.count({
          where: {
            projectId: project.id,
            status: "COMPLETED",
          },
        });

        return {
          ...project,
          _count: {
            ...(project as any)._count,
            completedTasks: completedTasksCount,
          },
        };
      })
    );

    // Calculate KPI data if requested
    if (includeKPI) {
      const projectsWithKPI = await Promise.all(
        projectsWithTaskCounts.map(async (project) => {
          const taskStats = await prisma.task.groupBy({
            by: ["status"],
            where: { projectId: project.id },
            _count: { id: true },
            _sum: {
              estimatedHours: true,
              actualHours: true,
            },
          });

          const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.id, 0);
          const completedTasks = taskStats.find(stat => stat.status === "COMPLETED")?._count.id || 0;
          const totalEstimatedHours = taskStats.reduce((sum, stat) => sum + (stat._sum.estimatedHours || 0), 0);
          const totalActualHours = taskStats.reduce((sum, stat) => sum + (stat._sum.actualHours || 0), 0);

          return {
            ...project,
            kpi: {
              totalTasks,
              completedTasks,
              completionPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
              totalEstimatedHours,
              totalActualHours,
              efficiency: totalEstimatedHours > 0 ? (totalActualHours / totalEstimatedHours) * 100 : 0,
            },
          };
        })
      );

      return NextResponse.json(projectsWithKPI);
    }

    return NextResponse.json(projectsWithTaskCounts);
  } catch (error) {
    console.error("Error fetching projects:", error);
    
    // Check if this is a database connection error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('connect') || errorMessage.includes('timeout') || errorMessage.includes('network')) {
      console.log('Database connection error detected, returning empty array');
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this is a fallback authentication session
    const isFallbackAuth = (session.user as any).isFallbackAuth;
    
    // If using fallback auth, return an error indicating database is unavailable
    if (isFallbackAuth) {
      return NextResponse.json(
        { error: "Database unavailable. Project creation is not available in fallback mode." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      status = "PLANNING",
      startDate,
      endDate,
      budget,
      departments = [],
      tags = [],
      teamMembers = [],
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Verify the current user exists in the database
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found in database. Please log in again." },
        { status: 400 }
      );
    }

    // Validate team members exist
    if (teamMembers.length > 0) {
      const validUsers = await prisma.user.findMany({
        where: { id: { in: teamMembers } },
        select: { id: true },
      });
      const validUserIds = validUsers.map(user => user.id);
      const invalidMembers = teamMembers.filter((id: string) => !validUserIds.includes(id));
      
      if (invalidMembers.length > 0) {
        return NextResponse.json(
          { error: `Invalid team members: ${invalidMembers.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        ownerId: currentUser.id, // Use the verified user ID
        departments,
        tags,
        approvalState: {},
        members: {
          create: teamMembers.map((memberId: string) => ({
            userId: memberId,
            role: memberId === currentUser.id ? "owner" : "member",
          })),
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            departmentName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true,
                departmentName: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
            comments: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: "Invalid user reference. Please log in again." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects - Update multiple projects (for bulk operations)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectIds, updates } = body;

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { error: "Project IDs array is required" },
        { status: 400 }
      );
    }

    // Ensure projectIds is a flat array
    const flatProjectIds = projectIds.flat();

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Updates object is required" },
        { status: 400 }
      );
    }

    // Handle date fields
    const processedUpdates = { ...updates };
    if (processedUpdates.startDate) {
      processedUpdates.startDate = new Date(processedUpdates.startDate);
    }
    if (processedUpdates.endDate) {
      processedUpdates.endDate = new Date(processedUpdates.endDate);
    }
    if (processedUpdates.budget) {
      processedUpdates.budget = parseFloat(processedUpdates.budget);
    }

    // Check if trying to complete projects with incomplete tasks
    if (processedUpdates.status === 'COMPLETED') {
      for (const projectId of flatProjectIds) {
        // Get all tasks for this project (including sub-tasks)
        const projectTasks = await prisma.task.findMany({
          where: { 
            projectId: projectId,
          },
          select: {
            id: true,
            title: true,
            status: true,
            parentTaskId: true,
          },
        });

        // Separate main tasks and sub-tasks
        const mainTasks = projectTasks.filter(task => !task.parentTaskId);
        const subTasks = projectTasks.filter(task => task.parentTaskId);

        // Check if any main tasks are incomplete
        const incompleteMainTasks = mainTasks.filter(task => task.status !== 'COMPLETED');
        if (incompleteMainTasks.length > 0) {
          return NextResponse.json(
            { 
              error: "Cannot complete project with incomplete tasks",
              projectId: projectId,
              incompleteTasks: incompleteMainTasks.map(t => ({ id: t.id, title: t.title }))
            },
            { status: 400 }
          );
        }

        // Check if any sub-tasks are incomplete
        const incompleteSubTasks = subTasks.filter(task => task.status !== 'COMPLETED');
        if (incompleteSubTasks.length > 0) {
          return NextResponse.json(
            { 
              error: "Cannot complete project with incomplete sub-tasks",
              projectId: projectId,
              incompleteSubTasks: incompleteSubTasks.map(t => ({ id: t.id, title: t.title }))
            },
            { status: 400 }
          );
        }
      }
    }

    // Update multiple projects
    const updatedProjects = await prisma.project.updateMany({
      where: {
        id: { in: flatProjectIds },
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
          { departments: { has: session.user.department } },
        ],
      },
      data: processedUpdates,
    });

    return NextResponse.json({
      message: `Updated ${updatedProjects.count} projects`,
      count: updatedProjects.count,
    });
  } catch (error) {
    console.error("Error updating projects:", error);
    return NextResponse.json(
      { error: "Failed to update projects" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects - Delete multiple projects
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectIds = searchParams.get("projectIds");

    if (!projectIds) {
      return NextResponse.json(
        { error: "Project IDs are required" },
        { status: 400 }
      );
    }

    const ids = projectIds.split(",");

    // Delete projects (cascade will handle related data)
    const deletedProjects = await prisma.project.deleteMany({
      where: {
        id: { in: ids },
        ownerId: session.user.id, // Only project owners can delete
      },
    });

    return NextResponse.json({
      message: `Deleted ${deletedProjects.count} projects`,
      count: deletedProjects.count,
    });
  } catch (error) {
    console.error("Error deleting projects:", error);
    return NextResponse.json(
      { error: "Failed to delete projects" },
      { status: 500 }
    );
  }
} 