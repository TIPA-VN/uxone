import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../../../middleware';

export const runtime = 'nodejs';

// POST /api/service/notifications/{id}/mark-read - Mark notification as read
export async function POST(
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

    // Mark notification as read
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
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

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'POST', `/api/service/notifications/${notificationId}/mark-read`, 200, responseTime);

    return NextResponse.json({
      message: 'Notification marked as read',
      notification: updatedNotification,
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'POST', '/api/service/notifications/[id]/mark-read', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
} 