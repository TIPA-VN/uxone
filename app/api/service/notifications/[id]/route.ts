import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../../middleware';

export const runtime = 'nodejs';

// GET /api/service/notifications/{id} - Get single notification
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
    if (!hasPermission(authContext.permissions, 'notifications:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: notificationId } = await params;

    // Fetch notification with service metadata
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        serviceNotification: {
          serviceId: authContext.serviceId,
        },
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
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'GET', `/api/service/notifications/${notificationId}`, 200, responseTime);

    return NextResponse.json(notification);

  } catch (error) {
    console.error('Error fetching service notification:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'GET', '/api/service/notifications/[id]', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/service/notifications/{id} - Update single notification
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
    if (!hasPermission(authContext.permissions, 'notifications:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: notificationId } = await params;
    const body = await request.json();
    const { serviceUpdates = {}, ...notificationUpdates } = body;

    // Verify notification belongs to this service
    const serviceNotification = await prisma.serviceNotification.findFirst({
      where: {
        notificationId,
        serviceId: authContext.serviceId,
      },
    });

    if (!serviceNotification) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    // Validate updates
    if (notificationUpdates.type && !['INFO', 'WARNING', 'ERROR', 'SUCCESS'].includes(notificationUpdates.type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    if (serviceUpdates.priority && !['HIGH', 'NORMAL', 'LOW'].includes(serviceUpdates.priority)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      );
    }

    // Prepare update data
    const notificationData: any = {};
    if (notificationUpdates.title !== undefined) notificationData.title = notificationUpdates.title;
    if (notificationUpdates.message !== undefined) notificationData.message = notificationUpdates.message;
    if (notificationUpdates.type !== undefined) notificationData.type = notificationUpdates.type;
    if (notificationUpdates.read !== undefined) notificationData.read = notificationUpdates.read;
    if (notificationUpdates.hidden !== undefined) notificationData.hidden = notificationUpdates.hidden;

    const serviceNotificationData: any = {};
    if (serviceUpdates.priority !== undefined) serviceNotificationData.priority = serviceUpdates.priority;
    if (serviceUpdates.expiresAt !== undefined) serviceNotificationData.expiresAt = serviceUpdates.expiresAt ? new Date(serviceUpdates.expiresAt) : null;
    if (serviceUpdates.metadata !== undefined) serviceNotificationData.metadata = serviceUpdates.metadata;

    // Update notification and service notification in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedNotification = await tx.notification.update({
        where: { id: notificationId },
        data: notificationData,
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

      let updatedServiceNotification = null;
      if (Object.keys(serviceNotificationData).length > 0) {
        updatedServiceNotification = await tx.serviceNotification.update({
          where: { notificationId },
          data: serviceNotificationData,
        });
      }

      return { updatedNotification, updatedServiceNotification };
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'PATCH', `/api/service/notifications/${notificationId}`, 200, responseTime);

    return NextResponse.json({
      ...result.updatedNotification,
      serviceNotification: result.updatedServiceNotification ? {
        serviceType: result.updatedServiceNotification.serviceType,
        priority: result.updatedServiceNotification.priority,
        expiresAt: result.updatedServiceNotification.expiresAt,
        metadata: result.updatedServiceNotification.metadata,
        createdAt: result.updatedServiceNotification.createdAt,
      } : result.updatedNotification.serviceNotification,
    });

  } catch (error) {
    console.error('Error updating service notification:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'PATCH', '/api/service/notifications/[id]', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/service/notifications/{id} - Delete single notification
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
    if (!hasPermission(authContext.permissions, 'notifications:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: notificationId } = await params;

    // Verify notification belongs to this service
    const serviceNotification = await prisma.serviceNotification.findFirst({
      where: {
        notificationId,
        serviceId: authContext.serviceId,
      },
    });

    if (!serviceNotification) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    // Delete notification (cascade will handle service notification)
    await prisma.notification.delete({
      where: { id: notificationId },
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'DELETE', `/api/service/notifications/${notificationId}`, 200, responseTime);

    return NextResponse.json({
      message: 'Notification deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting service notification:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'DELETE', '/api/service/notifications/[id]', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
} 