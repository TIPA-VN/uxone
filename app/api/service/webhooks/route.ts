import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../middleware';
import crypto from 'crypto';

export const runtime = 'nodejs';

// GET - List webhooks for service
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: any = {
      serviceId: authContext.serviceId,
    };

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Fetch webhooks with delivery stats
    const [webhooks, total] = await Promise.all([
      prisma.serviceWebhook.findMany({
        where,
        include: {
          deliveries: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
            select: {
              status: true,
              responseCode: true,
              attemptCount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.serviceWebhook.count({ where }),
    ]);

    // Calculate delivery stats for each webhook
    const webhooksWithStats = webhooks.map(webhook => {
      const deliveries = webhook.deliveries;
      const totalDeliveries = deliveries.length;
      const successfulDeliveries = deliveries.filter(d => d.status === 'SUCCESS').length;
      const failedDeliveries = deliveries.filter(d => d.status === 'FAILED').length;
      const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING').length;

      return {
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
      };
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'GET', '/api/service/webhooks', 200, responseTime);

    return NextResponse.json({
      success: true,
      data: webhooksWithStats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching webhooks:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

// POST - Register new webhook
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'webhooks:create')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      url,
      events,
      retryCount = 3,
      timeout = 30,
    } = body;

    // Validate required fields
    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Name, URL, and events are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate events
    const validEvents = [
      'approval.created',
      'approval.updated',
      'approval.approved',
      'approval.rejected',
      'approval.cancelled',
      'approval.escalated',
      'approval.delegated',
    ];

    const invalidEvents = events.filter(event => !validEvents.includes(event));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate retry count and timeout
    if (retryCount < 0 || retryCount > 10) {
      return NextResponse.json(
        { error: 'Retry count must be between 0 and 10' },
        { status: 400 }
      );
    }

    if (timeout < 5 || timeout > 300) {
      return NextResponse.json(
        { error: 'Timeout must be between 5 and 300 seconds' },
        { status: 400 }
      );
    }

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook
    const webhook = await prisma.serviceWebhook.create({
      data: {
        service: {
          connect: { id: authContext.serviceId }
        },
        name,
        url,
        events,
        secret,
        retryCount,
        timeout,
      },
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'POST', '/api/service/webhooks', 201, responseTime);

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
        secret: webhook.secret, // Include secret in response for initial setup
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating webhook:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
} 