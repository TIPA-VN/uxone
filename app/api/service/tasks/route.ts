import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../middleware';

export const runtime = 'nodejs';

// GET /api/service/tasks - List tasks with service filtering
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('serviceType');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const projectId = searchParams.get('projectId');
    const externalReference = searchParams.get('externalReference');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      serviceTask: {
        serviceId: authContext.serviceId,
      },
    };

    // Add service-specific filters
    if (serviceType) {
      where.serviceTask = {
        ...where.serviceTask,
        serviceType,
      };
    }

    if (externalReference) {
      where.serviceTask = {
        ...where.serviceTask,
        externalReference,
      };
    }

    // Add task-specific filters
    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    // Fetch tasks with service metadata
    const tasks = await prisma.task.findMany({
      where,
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
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.task.count({ where });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'GET', '/api/service/tasks', 200, responseTime);

    return NextResponse.json({
      tasks,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error('Error fetching service tasks:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'GET', '/api/service/tasks', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/service/tasks - Create a new task with service metadata
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'tasks:create')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status = 'TODO',
      priority = 'MEDIUM',
      projectId,
      assigneeId,
      ownerId,
      dueDate,
      serviceType,
      externalReference,
      metadata = {},
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    if (!serviceType) {
      return NextResponse.json(
        { error: 'Service type is required' },
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
          { error: 'Project not found' },
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
          { error: 'Assignee not found' },
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
          { error: 'Owner not found' },
          { status: 400 }
        );
      }
    }

    // Create task and service task in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the main task
      const task = await tx.task.create({
        data: {
          title,
          description,
          status,
          priority,
          projectId,
          assigneeId,
          ownerId,
          creatorId: ownerId, // Use owner as creator for service-created tasks
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
          _count: {
            select: {
              subtasks: true,
              comments: true,
              attachments: true,
            },
          },
        },
      });

      // Create service task metadata
      const serviceTask = await tx.serviceTask.create({
        data: {
          taskId: task.id,
          serviceId: authContext.serviceId,
          serviceType,
          externalReference,
          metadata,
        },
      });

      return { task, serviceTask };
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'POST', '/api/service/tasks', 201, responseTime);

    return NextResponse.json({
      ...result.task,
      serviceTask: result.serviceTask,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating service task:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'POST', '/api/service/tasks', 500, responseTime);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid reference. Please check project, assignee, or owner.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// PATCH /api/service/tasks - Bulk update tasks
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { taskIds, updates, serviceUpdates = {} } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: 'Task IDs array is required' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Updates object is required' },
        { status: 400 }
      );
    }

    // Verify all tasks belong to this service
    const serviceTasks = await prisma.serviceTask.findMany({
      where: {
        taskId: { in: taskIds },
        serviceId: authContext.serviceId,
      },
      select: { taskId: true },
    });

    const validTaskIds = serviceTasks.map(st => st.taskId);
    const invalidTaskIds = taskIds.filter(id => !validTaskIds.includes(id));

    if (invalidTaskIds.length > 0) {
      return NextResponse.json(
        { error: `Tasks not found or access denied: ${invalidTaskIds.join(', ')}` },
        { status: 403 }
      );
    }

    // Process updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update main tasks
      const updatedTasks = await tx.task.updateMany({
        where: { id: { in: taskIds } },
        data: updates,
      });

      // Update service task metadata if provided
      let updatedServiceTasks = null;
      if (Object.keys(serviceUpdates).length > 0) {
        updatedServiceTasks = await tx.serviceTask.updateMany({
          where: {
            taskId: { in: taskIds },
            serviceId: authContext.serviceId,
          },
          data: serviceUpdates,
        });
      }

      return { updatedTasks, updatedServiceTasks };
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'PATCH', '/api/service/tasks', 200, responseTime);

    return NextResponse.json({
      message: `Updated ${result.updatedTasks.count} tasks`,
      updatedTasks: result.updatedTasks.count,
      updatedServiceTasks: result.updatedServiceTasks?.count || 0,
    });

  } catch (error) {
    console.error('Error bulk updating service tasks:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'PATCH', '/api/service/tasks', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to update tasks' },
      { status: 500 }
    );
  }
}

// DELETE /api/service/tasks - Bulk delete tasks
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const taskIds = searchParams.get('taskIds');

    if (!taskIds) {
      return NextResponse.json(
        { error: 'Task IDs are required' },
        { status: 400 }
      );
    }

    const ids = taskIds.split(',');

    // Verify all tasks belong to this service
    const serviceTasks = await prisma.serviceTask.findMany({
      where: {
        taskId: { in: ids },
        serviceId: authContext.serviceId,
      },
      select: { taskId: true },
    });

    const validTaskIds = serviceTasks.map(st => st.taskId);
    const invalidTaskIds = ids.filter(id => !validTaskIds.includes(id));

    if (invalidTaskIds.length > 0) {
      return NextResponse.json(
        { error: `Tasks not found or access denied: ${invalidTaskIds.join(', ')}` },
        { status: 403 }
      );
    }

    // Delete tasks (cascade will handle service tasks)
    const deletedTasks = await prisma.task.deleteMany({
      where: { id: { in: ids } },
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'DELETE', '/api/service/tasks', 200, responseTime);

    return NextResponse.json({
      message: `Deleted ${deletedTasks.count} tasks`,
      count: deletedTasks.count,
    });

  } catch (error) {
    console.error('Error deleting service tasks:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'DELETE', '/api/service/tasks', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to delete tasks' },
      { status: 500 }
    );
  }
} 