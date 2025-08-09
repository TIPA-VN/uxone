import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/app/api/notifications/stream/route";

export const runtime = 'nodejs';

// GET /api/tasks - Get all tasks with enhanced filtering and relationships
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
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const ownerId = searchParams.get("ownerId");
    const parentTaskId = searchParams.get("parentTaskId");
    const includeSubtasks = searchParams.get("includeSubtasks") === "true";
    const includeDependencies = searchParams.get("includeDependencies") === "true";

    // Determine user's permission level
    const isManagerOrAbove = [
      "GENERAL_DIRECTOR", "GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER", "ASSISTANT_GENERAL_MANAGER_2",
      "SENIOR_MANAGER", "SENIOR_MANAGER_2", "ASSISTANT_SENIOR_MANAGER",
      "MANAGER", "MANAGER_2"
    ].includes(session.user.role);

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
      where.creatorId = session.user.id;
    }

    // Filter by parent task (for subtasks)
    if (parentTaskId) {
      where.parentTaskId = parentTaskId;
    } else if (!includeSubtasks) {
      // Only show top-level tasks unless explicitly requesting subtasks
      where.parentTaskId = null;
    }

    // Department-based filtering - users can only see tasks from their department
    // Managers and above can see all tasks, others see only their department
    if (!isManagerOrAbove) {
      where.OR = [
        { assignee: { department: session.user.department } },
        { owner: { department: session.user.department } },
        { creator: { department: session.user.department } },
        { project: { departments: { has: session.user.department } } }
      ];
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

    // Add permission information to each task
    const tasksWithPermissions = tasks.map((task: any) => {
      const isAssignee = task.assigneeId === session.user.id;
      const isOwner = task.ownerId === session.user.id;
      const isCreator = task.creatorId === session.user.id;
      const isTeamAssigned = task.project?.departments?.includes(session.user.department);

      return {
        ...task,
        permissions: {
          canEdit: isManagerOrAbove || isAssignee || isOwner || isCreator,
          canDelete: isManagerOrAbove || isOwner || isCreator,
          canView: true,
          isAssignee,
          isOwner,
          isCreator,
          isTeamAssigned,
        },
      };
    });

    return NextResponse.json(tasksWithPermissions);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    
    // Check if this is a database connection error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('connect') || errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return NextResponse.json([]);
    }
    
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

    // Check if this is a fallback authentication session
    const isFallbackAuth = (session.user as any).isFallbackAuth;
    
    // If using fallback auth, return an error indicating database is unavailable
    if (isFallbackAuth) {
      return NextResponse.json(
        { error: "Database unavailable. Task creation is not available in fallback mode." },
        { status: 503 }
      );
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
      dueDate,
      estimatedHours,
      tags = [],
    } = body;

    // Log the request data for debugging
    console.log("Task creation request data:", {
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
      tags,
      currentUserId: session.user.id
    });

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
      // Ensure projectId is a string, not an array
      const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId;
      
      // Additional validation for projectId format
      if (typeof projectIdString !== 'string' || projectIdString.trim() === '') {
        return NextResponse.json(
          { error: "Invalid project ID format" },
          { status: 400 }
        );
      }
      
      const project = await prisma.project.findUnique({
        where: { id: projectIdString },
      });
      if (!project) {
        console.error(`Project not found for ID: ${projectIdString}`);
        return NextResponse.json(
          { error: "Project not found" },
          { status: 400 }
        );
      }
    }

    // Validate parent task exists if provided
    if (parentTaskId) {
      // Additional validation for parentTaskId format
      if (typeof parentTaskId !== 'string' || parentTaskId.trim() === '') {
        return NextResponse.json(
          { error: "Invalid parent task ID format" },
          { status: 400 }
        );
      }
      
      const parentTask = await prisma.task.findUnique({
        where: { id: parentTaskId },
      });
      if (!parentTask) {
        console.error(`Parent task not found for ID: ${parentTaskId}`);
        return NextResponse.json(
          { error: "Parent task not found" },
          { status: 400 }
        );
      }
    }

    // Validate assignee exists if provided
    if (assigneeId) {
      // Additional validation for assigneeId format
      if (typeof assigneeId !== 'string' || assigneeId.trim() === '') {
        return NextResponse.json(
          { error: "Invalid assignee ID format" },
          { status: 400 }
        );
      }
      
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
      });
      if (!assignee) {
        console.error(`Assignee not found for ID: ${assigneeId}`);
        return NextResponse.json(
          { error: "Assignee not found" },
          { status: 400 }
        );
      }
    }

    // Validate owner exists if provided
    if (ownerId) {
      // Additional validation for ownerId format
      if (typeof ownerId !== 'string' || ownerId.trim() === '') {
        return NextResponse.json(
          { error: "Invalid owner ID format" },
          { status: 400 }
        );
      }
      
      const owner = await prisma.user.findUnique({
        where: { id: ownerId },
      });
      if (!owner) {
        console.error(`Owner not found for ID: ${ownerId}`);
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
        projectId: Array.isArray(projectId) ? projectId[0] : projectId,
        parentTaskId,
        assigneeId,
        ownerId: ownerId || currentUser.id,
        creatorId: currentUser.id,
        dueDate: dueDate ? new Date(dueDate) : null,
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

    // Create notification for assignee if task is assigned to someone else
    if (assigneeId && assigneeId !== currentUser.id) {
      try {
        const notification = await prisma.notification.create({
          data: {
            userId: assigneeId,
            title: `New Task Assigned`,
            message: `You have been assigned a new task: "${title}" by ${currentUser.name || currentUser.username}`,
            type: "info",
            link: `/lvm/tasks/${task.id}`,
          },
        });
        
        // Send real-time notification
        sendNotification(notification, assigneeId);
      } catch (error) {
        console.error("Error creating task assignment notification:", error);
        // Don't fail the task creation if notification fails
      }
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      console.error("Prisma foreign key constraint error:", error);
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

// PATCH /api/tasks - Update tasks (supports both individual and bulk updates)
export async function PATCH(request: NextRequest) {
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
        { error: "Database unavailable. Task updates are not available in fallback mode." },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    // Check if this is a bulk update (has taskIds array)
    if (body.taskIds && Array.isArray(body.taskIds)) {
      // Bulk update format
      const { taskIds, updates } = body;

      if (taskIds.length === 0) {
        return NextResponse.json(
          { error: "Task IDs array cannot be empty" },
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
            { creatorId: session.user.id },
          ],
        },
        data: processedUpdates,
      });

      return NextResponse.json({
        message: `Updated ${updatedTasks.count} tasks`,
        count: updatedTasks.count,
      });
    } else {
      // Individual task update format
      const { id, ...updates } = body;

      if (!id) {
        return NextResponse.json(
          { error: "Task ID is required" },
          { status: 400 }
        );
      }

      // Handle date fields
      const processedUpdates = { ...updates };
      if (processedUpdates.dueDate) {
        processedUpdates.dueDate = new Date(processedUpdates.dueDate);
      }

      // Check if user has access to the task
      const task = await prisma.task.findFirst({
        where: {
          id,
          OR: [
            { ownerId: session.user.id },
            { assigneeId: session.user.id },
            { creatorId: session.user.id },
          ],
        },
      });

      if (!task) {
        return NextResponse.json(
          { error: "Task not found or access denied" },
          { status: 404 }
        );
      }

      // Check if trying to complete a task with incomplete sub-tasks
      if (processedUpdates.status === 'COMPLETED') {
        const taskWithSubtasks = await prisma.task.findUnique({
          where: { id },
          include: {
            subtasks: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        });

        if (taskWithSubtasks && taskWithSubtasks.subtasks.length > 0) {
          const incompleteSubtasks = taskWithSubtasks.subtasks.filter(
            (subtask: any) => subtask.status !== 'COMPLETED'
          );

          if (incompleteSubtasks.length > 0) {
            return NextResponse.json(
              { 
                error: "Cannot complete task with incomplete sub-tasks",
                incompleteSubtasks: incompleteSubtasks.map((st: any) => ({ id: st.id, title: st.title }))
              },
              { status: 400 }
            );
          }
        }
      }

      // Update single task
      const updatedTask = await prisma.task.update({
        where: { id },
        data: processedUpdates,
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
          subtasks: {
            select: {
              id: true,
              title: true,
              status: true,
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

      // Check if this task completion affects parent task status
      if (processedUpdates.status === 'COMPLETED' && updatedTask.parentTask) {
        // Check if all sibling tasks are completed
        const parentTask = await prisma.task.findUnique({
          where: { id: updatedTask.parentTask.id },
          include: {
            subtasks: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        });

        if (parentTask && parentTask.subtasks.every((subtask: any) => subtask.status === 'COMPLETED')) {
          // All sub-tasks are completed, update parent task status
          await prisma.task.update({
            where: { id: parentTask.id },
            data: { status: 'COMPLETED' },
          });
        }
      }

      // Check if this task completion affects project status
      if (processedUpdates.status === 'COMPLETED' && updatedTask.project) {
        // Check if all tasks in the project are completed
        const projectTasks = await prisma.task.findMany({
          where: { 
            projectId: updatedTask.project.id,
            parentTaskId: null, // Only main tasks, not sub-tasks
          },
          select: {
            id: true,
            status: true,
          },
        });

        if (projectTasks.every((task: any) => task.status === 'COMPLETED')) {
          // All tasks are completed, update project status
          await prisma.project.update({
            where: { id: updatedTask.project.id },
            data: { status: 'COMPLETED' },
          });
        }
      }

      // Create notification for new assignee if assignee has changed
      if (processedUpdates.assigneeId && processedUpdates.assigneeId !== task.assigneeId && processedUpdates.assigneeId !== session.user.id) {
        try {
          const notification = await prisma.notification.create({
            data: {
              userId: processedUpdates.assigneeId,
              title: `Task Reassigned`,
              message: `You have been assigned the task: "${updatedTask.title}" by ${session.user.name || session.user.username}`,
              type: "info",
              link: `/lvm/tasks/${updatedTask.id}`,
            },
          });
          
          // Send real-time notification
          sendNotification(notification, processedUpdates.assigneeId);
        } catch (error) {
          console.error("Error creating task reassignment notification:", error);
          // Don't fail the task update if notification fails
        }
      }

      // Create notification for task owner when task is completed by assignee
      if (processedUpdates.status === 'COMPLETED' && task.status !== 'COMPLETED' && 
          session.user.id === task.assigneeId && 
          task.ownerId !== session.user.id && task.ownerId) {
        try {
          const notification = await prisma.notification.create({
            data: {
              userId: task.ownerId,
              title: `Task Completed`,
              message: `Your task "${updatedTask.title}" has been completed by ${session.user.name || session.user.username}`,
              type: "success",
              link: `/lvm/tasks/${updatedTask.id}`,
            },
          });
          
          // Send real-time notification
          sendNotification(notification, task.ownerId);
        } catch (error) {
          console.error("Error creating task completion notification:", error);
          // Don't fail the task update if notification fails
        }
      }

      return NextResponse.json(updatedTask);
    }
  } catch (error) {
    console.error("Error updating tasks:", error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: "Task not found or access denied" },
          { status: 404 }
        );
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: "Invalid reference. Please check project, assignee, or owner." },
          { status: 400 }
        );
      }
    }
    
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

    // Check if this is a fallback authentication session
    const isFallbackAuth = (session.user as any).isFallbackAuth;
    
    // If using fallback auth, return an error indicating database is unavailable
    if (isFallbackAuth) {
      return NextResponse.json(
        { error: "Database unavailable. Task deletion is not available in fallback mode." },
        { status: 503 }
      );
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
          { creatorId: session.user.id },
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