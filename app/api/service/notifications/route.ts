import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../middleware';

export const runtime = 'nodejs';

// GET /api/service/notifications - List notifications with filtering
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'notifications:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const serviceType = searchParams.get('serviceType');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const isRead = searchParams.get('isRead');
    const recipientId = searchParams.get('recipientId');
    const department = searchParams.get('department');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate limit
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      serviceNotification: {
        serviceId: authContext.serviceId,
      },
    };

    if (serviceType) {
      where.serviceNotification.serviceType = serviceType;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.serviceNotification.priority = priority;
    }

    if (isRead !== null) {
      where.read = isRead === 'true';
    }

    if (recipientId) {
      where.userId = recipientId;
    }

    if (department) {
      where.user = {
        department: department,
      };
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      orderBy[sortBy] = sortOrder;
    } else if (sortBy === 'priority') {
      orderBy.serviceNotification = {
        priority: sortOrder,
      };
    } else if (sortBy === 'title') {
      orderBy.title = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Get notifications with service metadata
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
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
          serviceNotification: {
            select: {
              serviceType: true,
              priority: true,
              expiresAt: true,
              metadata: true,
              createdAt: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);

    const responseTime = Date.now() - startTime;
    logServiceRequest(
      authContext.serviceId, 
      'GET', 
      '/api/service/notifications', 
      200, 
      responseTime,
      {
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      }
    );

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching service notifications:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest(
      'unknown', 
      'GET', 
      '/api/service/notifications', 
      500, 
      responseTime,
      {
        error: error instanceof Error ? error.message : String(error),
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      }
    );
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch notifications',
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(7)
      },
      { status: 500 }
    );
  }
}

// POST /api/service/notifications - Create new notification
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'notifications:create')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      message,
      type = 'INFO',
      priority = 'NORMAL',
      recipientId,
      department,
      expiresAt,
      serviceType,
      externalReference,
      metadata = {},
    } = body;

    // Validate required fields
    if (!title || !message || !serviceType) {
      return NextResponse.json(
        { error: 'Title, message, and serviceType are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['INFO', 'WARNING', 'ERROR', 'SUCCESS'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Validate priority
    if (!['HIGH', 'NORMAL', 'LOW'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      );
    }

    // Validate recipient if provided
    if (recipientId) {
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });
      if (!recipient) {
        return NextResponse.json(
          { error: 'Recipient not found' },
          { status: 400 }
        );
      }
    }

    // Create notification and service notification in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the main notification
      const notification = await tx.notification.create({
        data: {
          title,
          message,
          type,
          userId: recipientId || 'cmdllo7kd0000i3rof748c42y', // Use Logistics Head as default
          link: null, // Can be set later if needed
        },
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
      });

      // Create service notification metadata
      const serviceNotification = await tx.serviceNotification.create({
        data: {
          notificationId: notification.id,
          serviceId: authContext.serviceId,
          serviceType,
          priority,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          metadata: {
            ...metadata,
            externalReference,
            source: 'service-api',
            serviceName: authContext.serviceName,
          },
        },
      });

      return { notification, serviceNotification };
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'POST', '/api/service/notifications', 201, responseTime);

    return NextResponse.json({
      ...result.notification,
      serviceNotification: {
        serviceType: result.serviceNotification.serviceType,
        priority: result.serviceNotification.priority,
        expiresAt: result.serviceNotification.expiresAt,
        metadata: result.serviceNotification.metadata,
        createdAt: result.serviceNotification.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating service notification:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'POST', '/api/service/notifications', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/service/notifications - Bulk update notifications
export async function PATCH(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'notifications:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { notificationIds, updates = {}, serviceUpdates = {} } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Notification IDs are required' },
        { status: 400 }
      );
    }

    // Verify all notifications belong to this service
    const serviceNotifications = await prisma.serviceNotification.findMany({
      where: {
        notificationId: { in: notificationIds },
        serviceId: authContext.serviceId,
      },
      select: { notificationId: true },
    });

    const validNotificationIds = serviceNotifications.map(sn => sn.notificationId);
    const invalidNotificationIds = notificationIds.filter(id => !validNotificationIds.includes(id));

    if (invalidNotificationIds.length > 0) {
      return NextResponse.json(
        { error: `Notifications not found or access denied: ${invalidNotificationIds.join(', ')}` },
        { status: 403 }
      );
    }

    // Prepare update data
    const notificationUpdates: any = {};
    if (updates.title !== undefined) notificationUpdates.title = updates.title;
    if (updates.message !== undefined) notificationUpdates.message = updates.message;
    if (updates.type !== undefined) notificationUpdates.type = updates.type;
    if (updates.read !== undefined) notificationUpdates.read = updates.read;
    if (updates.hidden !== undefined) notificationUpdates.hidden = updates.hidden;

    const serviceNotificationUpdates: any = {};
    if (serviceUpdates.priority !== undefined) serviceNotificationUpdates.priority = serviceUpdates.priority;
    if (serviceUpdates.expiresAt !== undefined) serviceNotificationUpdates.expiresAt = serviceUpdates.expiresAt ? new Date(serviceUpdates.expiresAt) : null;
    if (serviceUpdates.metadata !== undefined) serviceNotificationUpdates.metadata = serviceUpdates.metadata;

    // Perform bulk updates
    const result = await prisma.$transaction(async (tx) => {
      const updatedNotifications = await tx.notification.updateMany({
        where: { id: { in: notificationIds } },
        data: notificationUpdates,
      });

      let updatedServiceNotifications = null;
      if (Object.keys(serviceNotificationUpdates).length > 0) {
        updatedServiceNotifications = await tx.serviceNotification.updateMany({
          where: { notificationId: { in: notificationIds } },
          data: serviceNotificationUpdates,
        });
      }

      return { updatedNotifications, updatedServiceNotifications };
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'PATCH', '/api/service/notifications', 200, responseTime);

    return NextResponse.json({
      message: `Updated ${result.updatedNotifications.count} notifications`,
      updatedNotifications: result.updatedNotifications.count,
      updatedServiceNotifications: result.updatedServiceNotifications?.count || 0,
    });

  } catch (error) {
    console.error('Error bulk updating service notifications:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'PATCH', '/api/service/notifications', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// DELETE /api/service/notifications - Bulk delete notifications
export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'notifications:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const notificationIds = searchParams.get('notificationIds');

    if (!notificationIds) {
      return NextResponse.json(
        { error: 'Notification IDs are required' },
        { status: 400 }
      );
    }

    const ids = notificationIds.split(',');

    // Verify all notifications belong to this service
    const serviceNotifications = await prisma.serviceNotification.findMany({
      where: {
        notificationId: { in: ids },
        serviceId: authContext.serviceId,
      },
      select: { notificationId: true },
    });

    const validNotificationIds = serviceNotifications.map(sn => sn.notificationId);
    const invalidNotificationIds = ids.filter(id => !validNotificationIds.includes(id));

    if (invalidNotificationIds.length > 0) {
      return NextResponse.json(
        { error: `Notifications not found or access denied: ${invalidNotificationIds.join(', ')}` },
        { status: 403 }
      );
    }

    // Delete notifications (cascade will handle service notifications)
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { id: { in: ids } },
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'DELETE', '/api/service/notifications', 200, responseTime);

    return NextResponse.json({
      message: `Deleted ${deletedNotifications.count} notifications`,
      count: deletedNotifications.count,
    });

  } catch (error) {
    console.error('Error deleting service notifications:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'DELETE', '/api/service/notifications', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
} 