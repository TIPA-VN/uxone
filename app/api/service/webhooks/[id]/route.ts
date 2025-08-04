import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../../middleware';

export const runtime = 'nodejs';

// GET - Get webhook details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'webhooks:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: webhookId } = await params;

    // Fetch webhook with delivery history
    const webhook = await prisma.serviceWebhook.findFirst({
      where: {
        id: webhookId,
        serviceId: authContext.serviceId,
      },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 deliveries
          include: {
            event: {
              select: {
                eventType: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Calculate delivery stats
    const deliveries = webhook.deliveries;
    const totalDeliveries = deliveries.length;
    const successfulDeliveries = deliveries.filter(d => d.status === 'SUCCESS').length;
    const failedDeliveries = deliveries.filter(d => d.status === 'FAILED').length;
    const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING').length;

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'GET', `/api/service/webhooks/${webhookId}`, 200, responseTime);

    return NextResponse.json({
      success: true,
      data: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        retryCount: webhook.retryCount,
        timeout: webhook.timeout,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
        stats: {
          totalDeliveries,
          successfulDeliveries,
          failedDeliveries,
          pendingDeliveries,
          successRate: totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0,
        },
        recentDeliveries: deliveries.map(delivery => ({
          id: delivery.id,
          status: delivery.status,
          responseCode: delivery.responseCode,
          attemptCount: delivery.attemptCount,
          createdAt: delivery.createdAt,
          deliveredAt: delivery.deliveredAt,
          event: delivery.event,
        })),
      },
    });

  } catch (error) {
    console.error('Error fetching webhook:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

// PUT - Update webhook
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'webhooks:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: webhookId } = await params;
    const body = await request.json();
    const {
      name,
      url,
      events,
      isActive,
      retryCount,
      timeout,
    } = body;

    // Check if webhook exists and belongs to service
    const existingWebhook = await prisma.serviceWebhook.findFirst({
      where: {
        id: webhookId,
        serviceId: authContext.serviceId,
      },
    });

    if (!existingWebhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Validate URL format if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Validate events if provided
    if (events) {
      const validEvents = [
        'approval.created',
        'approval.updated',
        'approval.approved',
        'approval.rejected',
        'approval.cancelled',
        'approval.escalated',
        'approval.delegated',
      ];

      const invalidEvents = events.filter((event: string) => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Invalid events: ${invalidEvents.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate retry count if provided
    if (retryCount !== undefined && (retryCount < 0 || retryCount > 10)) {
      return NextResponse.json(
        { error: 'Retry count must be between 0 and 10' },
        { status: 400 }
      );
    }

    // Validate timeout if provided
    if (timeout !== undefined && (timeout < 5 || timeout > 300)) {
      return NextResponse.json(
        { error: 'Timeout must be between 5 and 300 seconds' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (events !== undefined) updateData.events = events;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (retryCount !== undefined) updateData.retryCount = retryCount;
    if (timeout !== undefined) updateData.timeout = timeout;

    // Update webhook
    const updatedWebhook = await prisma.serviceWebhook.update({
      where: { id: webhookId },
      data: updateData,
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'PUT', `/api/service/webhooks/${webhookId}`, 200, responseTime);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedWebhook.id,
        name: updatedWebhook.name,
        url: updatedWebhook.url,
        events: updatedWebhook.events,
        isActive: updatedWebhook.isActive,
        retryCount: updatedWebhook.retryCount,
        timeout: updatedWebhook.timeout,
        createdAt: updatedWebhook.createdAt,
        updatedAt: updatedWebhook.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error updating webhook:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

// DELETE - Delete webhook
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'webhooks:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: webhookId } = await params;

    // Check if webhook exists and belongs to service
    const existingWebhook = await prisma.serviceWebhook.findFirst({
      where: {
        id: webhookId,
        serviceId: authContext.serviceId,
      },
    });

    if (!existingWebhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Delete webhook (cascade will handle related records)
    await prisma.serviceWebhook.delete({
      where: { id: webhookId },
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'DELETE', `/api/service/webhooks/${webhookId}`, 200, responseTime);

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting webhook:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
} 