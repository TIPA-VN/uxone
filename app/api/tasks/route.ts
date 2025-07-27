import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tasks - Get all tasks with enhanced filtering and relationships
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const ownerId = searchParams.get("ownerId");
    const parentTaskId = searchParams.get("parentTaskId");
    const includeSubtasks = searchParams.get("includeSubtasks") === "true";
    const includeDependencies = searchParams.get("includeDependencies") === "true";

    const where: any = {};

    // Filter by project
    if (projectId) {
      where.projectId = projectId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by priority
    if (priority) {
      where.priority = priority;
    }

    // Filter by assignee
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // Filter by owner
    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Filter by parent task (for subtasks)
    if (parentTaskId) {
      where.parentTaskId = parentTaskId;
    } else if (!includeSubtasks) {
      // Only show top-level tasks unless explicitly requesting subtasks
      where.parentTaskId = null;
    }

    const include: any = {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          username: true,
          department: true,
          departmentName: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          username: true,
          department: true,
          departmentName: true,
        },
      },
      creator: {
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
          attachments: true,
        },
      },
    };

    // Include subtasks if requested
    if (includeSubtasks) {
      include.subtasks = {
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
      };
    }

    // Include dependencies if requested
    if (includeDependencies) {
      include.dependencies = {
        include: {
          blockingTask: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
      };
      include.blockingTasks = {
        include: {
          dependentTask: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include,
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status = "TODO",
      priority = "MEDIUM",
      projectId,
      parentTaskId,
      assigneeId,
      ownerId,
      assignedDepartments = [],
      dueDate,
      estimatedHours,
      tags = [],
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Task title is required" },
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

    // Validate project exists if provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 400 }
        );
      }
    }

    // Validate parent task exists if provided
    if (parentTaskId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: parentTaskId },
      });
      if (!parentTask) {
        return NextResponse.json(
          { error: "Parent task not found" },
          { status: 400 }
        );
      }
    }

    // Validate assignee exists if provided
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
      });
      if (!assignee) {
        return NextResponse.json(
          { error: "Assignee not found" },
          { status: 400 }
        );
      }
    }

    // Validate owner exists if provided
    if (ownerId) {
      const owner = await prisma.user.findUnique({
        where: { id: ownerId },
      });
      if (!owner) {
        return NextResponse.json(
          { error: "Owner not found" },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        projectId,
        parentTaskId,
        assigneeId,
        ownerId: ownerId || currentUser.id,
        createdBy: currentUser.id,
        assignedDepartments,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        tags,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            departmentName: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            departmentName: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            departmentName: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: "Invalid reference. Please check project, assignee, or owner." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks - Update multiple tasks (for bulk operations)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskIds, updates } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: "Task IDs array is required" },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Updates object is required" },
        { status: 400 }
      );
    }

    // Handle date fields
    const processedUpdates = { ...updates };
    if (processedUpdates.dueDate) {
      processedUpdates.dueDate = new Date(processedUpdates.dueDate);
    }

    // Update multiple tasks
    const updatedTasks = await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        OR: [
          { ownerId: session.user.id },
          { assigneeId: session.user.id },
          { createdBy: session.user.id },
        ],
      },
      data: processedUpdates,
    });

    return NextResponse.json({
      message: `Updated ${updatedTasks.count} tasks`,
      count: updatedTasks.count,
    });
  } catch (error) {
    console.error("Error updating tasks:", error);
    return NextResponse.json(
      { error: "Failed to update tasks" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks - Delete multiple tasks
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskIds = searchParams.get("taskIds");

    if (!taskIds) {
      return NextResponse.json(
        { error: "Task IDs are required" },
        { status: 400 }
      );
    }

    const ids = taskIds.split(",");

    // Delete tasks (cascade will handle subtasks, dependencies, etc.)
    const deletedTasks = await prisma.task.deleteMany({
      where: {
        id: { in: ids },
        OR: [
          { ownerId: session.user.id },
          { createdBy: session.user.id },
        ],
      },
    });

    return NextResponse.json({
      message: `Deleted ${deletedTasks.count} tasks`,
      count: deletedTasks.count,
    });
  } catch (error) {
    console.error("Error deleting tasks:", error);
    return NextResponse.json(
      { error: "Failed to delete tasks" },
      { status: 500 }
    );
  }
} 