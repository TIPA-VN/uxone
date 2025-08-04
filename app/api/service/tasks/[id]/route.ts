import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../../middleware';

export const runtime = 'nodejs';

// GET /api/service/tasks/[id] - Get single task with service metadata
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'tasks:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: taskId } = await params;

    // Fetch task with service metadata
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        serviceTask: {
          serviceId: authContext.serviceId,
        },
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
            status: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assignee: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        serviceTask: {
          select: {
            serviceType: true,
            externalReference: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
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

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'GET', `/api/service/tasks/${taskId}`, 200, responseTime);

    return NextResponse.json(task);

  } catch (error) {
    console.error('Error fetching service task:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'GET', `/api/service/tasks/${params.id}`, 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PATCH /api/service/tasks/[id] - Update single task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'tasks:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: taskId } = await params;
    const body = await request.json();
    const { serviceUpdates = {}, ...taskUpdates } = body;

    // Verify task belongs to this service
    const serviceTask = await prisma.serviceTask.findFirst({
      where: {
        taskId,
        serviceId: authContext.serviceId,
      },
    });

    if (!serviceTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Validate references if provided
    if (taskUpdates.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: taskUpdates.projectId },
      });
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 400 }
        );
      }
    }

    if (taskUpdates.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: taskUpdates.assigneeId },
      });
      if (!assignee) {
        return NextResponse.json(
          { error: 'Assignee not found' },
          { status: 400 }
        );
      }
    }

    if (taskUpdates.ownerId) {
      const owner = await prisma.user.findUnique({
        where: { id: taskUpdates.ownerId },
      });
      if (!owner) {
        return NextResponse.json(
          { error: 'Owner not found' },
          { status: 400 }
        );
      }
    }

    // Process date fields
    if (taskUpdates.dueDate) {
      taskUpdates.dueDate = new Date(taskUpdates.dueDate);
    }

    // Update task and service metadata in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update main task
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: taskUpdates,
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
            },
          },
          subtasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              assignee: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
          serviceTask: {
            select: {
              serviceType: true,
              externalReference: true,
              metadata: true,
              createdAt: true,
              updatedAt: true,
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

      // Update service task metadata if provided
      let updatedServiceTask = null;
      if (Object.keys(serviceUpdates).length > 0) {
        updatedServiceTask = await tx.serviceTask.update({
          where: {
            taskId,
            serviceId: authContext.serviceId,
          },
          data: serviceUpdates,
        });
      }

      return { updatedTask, updatedServiceTask };
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'PATCH', `/api/service/tasks/${taskId}`, 200, responseTime);

    return NextResponse.json({
      ...result.updatedTask,
      serviceTask: result.updatedServiceTask || result.updatedTask.serviceTask,
    });

  } catch (error) {
    console.error('Error updating service task:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'PATCH', `/api/service/tasks/${params.id}`, 500, responseTime);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid reference. Please check project, assignee, or owner.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/service/tasks/[id] - Delete single task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'tasks:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: taskId } = await params;

    // Verify task belongs to this service
    const serviceTask = await prisma.serviceTask.findFirst({
      where: {
        taskId,
        serviceId: authContext.serviceId,
      },
    });

    if (!serviceTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Check if task has incomplete subtasks
    const taskWithSubtasks = await prisma.task.findUnique({
      where: { id: taskId },
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
        subtask => subtask.status !== 'COMPLETED'
      );

      if (incompleteSubtasks.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot delete task with incomplete sub-tasks',
            incompleteSubtasks: incompleteSubtasks.map(st => ({ id: st.id, title: st.title })),
          },
          { status: 400 }
        );
      }
    }

    // Delete task (cascade will handle service task)
    await prisma.task.delete({
      where: { id: taskId },
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'DELETE', `/api/service/tasks/${taskId}`, 200, responseTime);

    return NextResponse.json({
      message: 'Task deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting service task:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'DELETE', `/api/service/tasks/${params.id}`, 500, responseTime);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
} 