import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../../middleware';

export const runtime = 'nodejs';

// GET /api/service/notifications/preferences - Get service notification preferences
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'notifications:manage')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get service app with notification preferences
    const serviceApp = await prisma.serviceApp.findUnique({
      where: { id: authContext.serviceId },
      select: {
        id: true,
        name: true,
        permissions: true,
        rateLimit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!serviceApp) {
      return NextResponse.json(
        { error: 'Service app not found' },
        { status: 404 }
      );
    }

    // Get notification statistics for this service
    const [totalNotifications, unreadNotifications, readNotifications] = await Promise.all([
      prisma.serviceNotification.count({
        where: { serviceId: authContext.serviceId },
      }),
      prisma.serviceNotification.count({
        where: {
          serviceId: authContext.serviceId,
          notification: { read: false },
        },
      }),
      prisma.serviceNotification.count({
        where: {
          serviceId: authContext.serviceId,
          notification: { read: true },
        },
      }),
    ]);

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'GET', '/api/service/notifications/preferences', 200, responseTime);

    return NextResponse.json({
      service: serviceApp,
      notificationStats: {
        total: totalNotifications,
        unread: unreadNotifications,
        read: readNotifications,
      },
      preferences: {
        // Default preferences - can be extended with a separate preferences table
        enabled: true,
        defaultPriority: 'NORMAL',
        defaultExpiration: null, // No default expiration
        allowedTypes: ['INFO', 'WARNING', 'ERROR', 'SUCCESS'],
        rateLimit: serviceApp.rateLimit,
      },
    });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'GET', '/api/service/notifications/preferences', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// PATCH /api/service/notifications/preferences - Update service notification preferences
export async function PATCH(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'notifications:manage')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      defaultPriority,
      defaultExpiration,
      allowedTypes,
      rateLimit,
    } = body;

    // Validate inputs
    if (defaultPriority && !['HIGH', 'NORMAL', 'LOW'].includes(defaultPriority)) {
      return NextResponse.json(
        { error: 'Invalid default priority' },
        { status: 400 }
      );
    }

    if (allowedTypes && (!Array.isArray(allowedTypes) || !allowedTypes.every(type => ['INFO', 'WARNING', 'ERROR', 'SUCCESS'].includes(type)))) {
      return NextResponse.json(
        { error: 'Invalid allowed types' },
        { status: 400 }
      );
    }

    if (rateLimit && (typeof rateLimit !== 'number' || rateLimit < 1 || rateLimit > 1000)) {
      return NextResponse.json(
        { error: 'Rate limit must be between 1 and 1000' },
        { status: 400 }
      );
    }

    // Update service app preferences
    const updateData: any = {};
    if (rateLimit !== undefined) updateData.rateLimit = rateLimit;

    const updatedServiceApp = await prisma.serviceApp.update({
      where: { id: authContext.serviceId },
      data: updateData,
      select: {
        id: true,
        name: true,
        permissions: true,
        rateLimit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'PATCH', '/api/service/notifications/preferences', 200, responseTime);

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
      service: updatedServiceApp,
      updatedPreferences: {
        defaultPriority,
        defaultExpiration,
        allowedTypes,
        rateLimit: updatedServiceApp.rateLimit,
      },
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'PATCH', '/api/service/notifications/preferences', 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
} 