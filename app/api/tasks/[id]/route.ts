import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/app/api/notifications/stream/route";

export const runtime = 'nodejs';

// GET /api/tasks/[id] - Get a specific task with all relationships
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            description: true,
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
            status: true,
            priority: true,
          },
        },
        subtasks: {
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
            { createdAt: "asc" },
          ],
        },
        dependencies: {
          include: {
            dependencyTask: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            },
          },
        },
        dependents: {
          include: {
            dependentTask: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            },
          },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true,
                departmentName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true,
            dependencies: true,
            dependents: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update a specific task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      projectId,
      parentTaskId,
      assigneeId,
      ownerId,
      dueDate,
      estimatedHours,
      actualHours,
      tags,
    } = body;

    // Verify task access (owner, assignee, or creator)
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { assigneeId: session.user.id },
          { creatorId: session.user.id },
        ],
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    // Validate parent task exists if provided
    if (parentTaskId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: parentTaskId },
      });
      if (!parentTask) {
        return NextResponse.json(
          { error: "Parent task not found" },
          { status: 404 }
        );
      }
      // Prevent circular references
      if (parentTaskId === id) {
        return NextResponse.json(
          { error: "Task cannot be its own parent" },
          { status: 400 }
        );
      }
    }

    // Validate project exists if provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (projectId !== undefined) updateData.projectId = projectId;
    if (parentTaskId !== undefined) updateData.parentTaskId = parentTaskId;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (ownerId !== undefined) updateData.ownerId = ownerId;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (tags !== undefined) updateData.tags = tags;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
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
            status: true,
            priority: true,
          },
        },
        subtasks: {
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

    // Create notification for new assignee if assignee has changed
    if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId && assigneeId !== session.user.id) {
      try {
        const notification = await prisma.notification.create({
          data: {
            userId: assigneeId,
            title: `Task Reassigned`,
            message: `You have been assigned the task: "${updatedTask.title}" by ${session.user.name || session.user.username}`,
            type: "info",
            link: `/lvm/tasks/${updatedTask.id}`,
          },
        });
        
        // Send real-time notification
        sendNotification(notification, assigneeId);
      } catch (error) {
        console.error("Error creating task reassignment notification:", error);
        // Don't fail the task update if notification fails
      }
    }

    // Create notification for task owner when task is completed by assignee
    if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED' && 
        session.user.id === existingTask.assigneeId && 
        existingTask.ownerId !== session.user.id && existingTask.ownerId) {
      try {
        const notification = await prisma.notification.create({
          data: {
            userId: existingTask.ownerId,
            title: `Task Completed`,
            message: `Your task "${updatedTask.title}" has been completed by ${session.user.name || session.user.username}`,
            type: "success",
            link: `/lvm/tasks/${updatedTask.id}`,
          },
        });
        
        // Send real-time notification
        sendNotification(notification, existingTask.ownerId);
      } catch (error) {
        console.error("Error creating task completion notification:", error);
        // Don't fail the task update if notification fails
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a specific task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify task ownership or creation
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { creatorId: session.user.id },
        ],
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    // Delete task (cascade will handle subtasks, dependencies, comments, attachments)
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
} 