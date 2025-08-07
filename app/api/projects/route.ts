import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDocumentNumber } from "@/lib/documentNumberGenerator";
import { sendNotification } from "@/app/api/notifications/stream/route";

// Type definitions for better type safety
interface ProjectWithCounts {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  ownerId: string;
  departments: string[];
  documentTemplate?: string;
  documentNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name?: string;
    username: string;
    department?: string;
    departmentName?: string;
  };
  _count: {
    tasks: number;
    documents: number;
    comments: number;
    members: number;
    completedTasks?: number;
  };
}

interface TaskWithBasicInfo {
  id: string;
  title: string;
  status: string;
  parentTaskId?: string;
}

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

    // Determine user's permission level
    const isManagerOrAbove = [
      "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
      "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
      "MANAGER", "MANAGER_2"
    ].includes(session.user.role);

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

    // Department-based filtering - users can only see projects from their department
    // Managers and above can see all projects, others see only their department
    if (!isManagerOrAbove) {
      where.OR = [
        { departments: { has: session.user.department } },
        { owner: { department: session.user.department } },
        { members: { some: { user: { department: session.user.department } } } }
      ];
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
      projects.map(async (project: ProjectWithCounts) => {
        const completedTasksCount = await prisma.task.count({
          where: {
            projectId: project.id,
            status: "COMPLETED",
          },
        });

        // Determine project-specific permissions
        const isOwner = project.ownerId === session.user.id;
        const isTeamMember = (project as any).members?.some((member: any) => member.userId === session.user.id);
        const isTeamAssigned = project.departments?.includes(session.user.department);

        return {
          ...project,
          _count: {
            ...(project as any)._count,
            completedTasks: completedTasksCount,
          },
          permissions: {
            canEdit: isManagerOrAbove || isOwner,
            canDelete: isManagerOrAbove || isOwner,
            canView: true,
            isOwner,
            isTeamMember,
            isTeamAssigned,
          },
        };
      })
    );

    // Calculate KPI data if requested
    if (includeKPI) {
      const projectsWithKPI = await Promise.all(
        projectsWithTaskCounts.map(async (project: ProjectWithCounts) => {
          const taskStats = await prisma.task.groupBy({
            by: ["status"],
            where: { projectId: project.id },
            _count: { id: true },
          });

          const totalTasks = taskStats.reduce((sum: number, stat: { _count: { id: number } }) => sum + stat._count.id, 0);
          const completedTasks = taskStats.find((stat: { status: string; _count: { id: number } }) => stat.status === "COMPLETED")?._count.id || 0;

          return {
            ...project,
            kpi: {
              totalTasks,
              completedTasks,
              completionPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
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
      documentTemplateId,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Generate document number if template is provided
    let documentNumber = null;
    let generatedDocumentNumber = null;
    
    if (documentTemplateId) {
      try {
        generatedDocumentNumber = await generateDocumentNumber(documentTemplateId, undefined, session.user.id);
        documentNumber = generatedDocumentNumber.documentNumber;
      } catch (error) {
        console.error("Error generating document number:", error);
        return NextResponse.json(
          { error: "Failed to generate document number" },
          { status: 400 }
        );
      }
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
      const validUserIds = validUsers.map((user: { id: string }) => user.id);
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
        documentTemplate: documentTemplateId,
        documentNumber,
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

    // Link the generated document number to the project if it exists
    if (generatedDocumentNumber) {
      await prisma.documentNumber.update({
        where: { id: generatedDocumentNumber.id },
        data: { projectId: project.id },
      });
    }

    // Create notifications for project creation
    try {
      // 1. Notify department heads/managers of involved departments
      const departmentUsers = await prisma.user.findMany({
        where: {
          department: { in: departments },
          role: { in: ["MANAGER", "SENIOR_MANAGER", "GENERAL_MANAGER", "ADMIN"] },
          isActive: true,
        },
        select: { id: true, name: true, username: true, department: true },
      });

      // 2. Notify team members (excluding the owner who will get a different notification)
      const teamMemberIds = teamMembers.filter(id => id !== currentUser.id);
      const teamMemberUsers = teamMemberIds.length > 0 ? await prisma.user.findMany({
        where: { id: { in: teamMemberIds } },
        select: { id: true, name: true, username: true },
      }) : [];

      // 3. Create notifications for department heads
      for (const deptUser of departmentUsers) {
        if (deptUser.id !== currentUser.id) { // Don't notify the owner twice
          const notification = await prisma.notification.create({
            data: {
              userId: deptUser.id,
              title: `New Project Created: ${project.name}`,
              message: `${currentUser.name || currentUser.username} has created a new project "${project.name}" involving your department (${deptUser.department}).`,
              type: "info",
              link: `/lvm/projects/${project.id}`,
            },
          });
          sendNotification(notification, deptUser.id);
        }
      }

      // 4. Create notifications for team members
      for (const member of teamMemberUsers) {
        const notification = await prisma.notification.create({
          data: {
            userId: member.id,
            title: `You've been added to project: ${project.name}`,
            message: `${currentUser.name || currentUser.username} has added you to the project "${project.name}".`,
            type: "info",
            link: `/lvm/projects/${project.id}`,
          },
        });
        sendNotification(notification, member.id);
      }

      // 5. Create confirmation notification for project owner
      const ownerNotification = await prisma.notification.create({
        data: {
          userId: currentUser.id,
          title: `Project Created Successfully: ${project.name}`,
          message: `Your project "${project.name}" has been created successfully.${documentNumber ? ` Document number: ${documentNumber}` : ''}`,
          type: "success",
          link: `/lvm/projects/${project.id}`,
        },
      });
      sendNotification(ownerNotification, currentUser.id);

    } catch (error) {
      console.error("Error creating notifications:", error);
      // Don't fail the project creation if notifications fail
    }

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
        const mainTasks = projectTasks.filter((task: TaskWithBasicInfo) => !task.parentTaskId);
        const subTasks = projectTasks.filter((task: TaskWithBasicInfo) => task.parentTaskId);

        // Check if any main tasks are incomplete
        const incompleteMainTasks = mainTasks.filter((task: TaskWithBasicInfo) => task.status !== 'COMPLETED');
        if (incompleteMainTasks.length > 0) {
          return NextResponse.json(
            { 
              error: "Cannot complete project with incomplete tasks",
              projectId: projectId,
              incompleteTasks: incompleteMainTasks.map((t: TaskWithBasicInfo) => ({ id: t.id, title: t.title }))
            },
            { status: 400 }
          );
        }

        // Check if any sub-tasks are incomplete
        const incompleteSubTasks = subTasks.filter((task: TaskWithBasicInfo) => task.status !== 'COMPLETED');
        if (incompleteSubTasks.length > 0) {
          return NextResponse.json(
            { 
              error: "Cannot complete project with incomplete sub-tasks",
              projectId: projectId,
              incompleteSubTasks: incompleteSubTasks.map((t: TaskWithBasicInfo) => ({ id: t.id, title: t.title }))
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