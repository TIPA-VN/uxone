import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id] - Get a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
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

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access to this project
    const hasAccess = 
      project.ownerId === session.user.id ||
      project.members.some(member => member.userId === session.user.id) ||
      project.departments.includes(session.user.department || "");

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update a specific project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();

    // Check if project exists and user has access
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            parentTaskId: true,
          },
        },
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has permission to update this project
    const hasPermission = 
      existingProject.ownerId === session.user.id ||
      existingProject.members.some((member: { userId: string }) => member.userId === session.user.id) ||
      existingProject.departments.includes(session.user.department || "");

    if (!hasPermission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Handle date fields
    const processedUpdates = { ...body };
    if (processedUpdates.startDate) {
      processedUpdates.startDate = new Date(processedUpdates.startDate);
    }
    if (processedUpdates.endDate) {
      processedUpdates.endDate = new Date(processedUpdates.endDate);
    }
    if (processedUpdates.requestDate) {
      processedUpdates.requestDate = new Date(processedUpdates.requestDate);
    }
    if (processedUpdates.budget) {
      processedUpdates.budget = parseFloat(processedUpdates.budget);
    }

    // Check if trying to complete project with incomplete tasks
    if (processedUpdates.status === 'COMPLETED') {
      const mainTasks = existingProject.tasks.filter(task => !task.parentTaskId);
      const subTasks = existingProject.tasks.filter(task => task.parentTaskId);

      // Check if any main tasks are incomplete
      const incompleteMainTasks = mainTasks.filter(task => task.status !== 'COMPLETED');
      if (incompleteMainTasks.length > 0) {
        return NextResponse.json(
          { 
            error: "Cannot complete project with incomplete tasks",
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
            incompleteSubTasks: incompleteSubTasks.map(t => ({ id: t.id, title: t.title }))
          },
          { status: 400 }
        );
      }
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: processedUpdates,
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

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a specific project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check if project exists and user has access
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only project owner can delete the project
    if (existingProject.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owner can delete project" }, { status: 403 });
    }

    // Delete the project (this will cascade delete related records)
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
} 