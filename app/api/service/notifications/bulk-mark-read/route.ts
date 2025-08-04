import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../../middleware';

export const runtime = 'nodejs';

// POST /api/service/notifications/bulk-mark-read - Bulk mark notifications as read
export async function POST(request: NextRequest) {
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
    const { notificationIds } = body;

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

    // Mark notifications as read
    const updatedNotifications = await prisma.notification.updateMany({
      where: { id: { in: notificationIds } },
      data: { read: true },
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'POST', '/api/service/notifications/bulk-mark-read', 200, responseTime);

    return NextResponse.json({
      message: `Marked ${updatedNotifications.count} notifications as read`,
      count: updatedNotifications.count,
    });

  } catch (error) {
    console.error('Error bulk marking notifications as read:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'POST', '/api/service/notifications/bulk-mark-read', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
} 