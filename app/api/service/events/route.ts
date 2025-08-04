import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../middleware';

export const runtime = 'nodejs';

// GET - List events for service
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'events:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const eventType = searchParams.get('eventType');
    const approvalId = searchParams.get('approvalId');

    // Build where clause
    const where: any = {
      serviceId: authContext.serviceId,
    };

    if (eventType) {
      where.eventType = eventType;
    }

    if (approvalId) {
      where.approvalId = approvalId;
    }

    // Fetch events with delivery stats
    const [events, total] = await Promise.all([
      prisma.webhookEvent.findMany({
        where,
        include: {
          approval: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          deliveries: {
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
      prisma.webhookEvent.count({ where }),
    ]);

    // Calculate delivery stats for each event
    const eventsWithStats = events.map(event => {
      const deliveries = event.deliveries;
      const totalDeliveries = deliveries.length;
      const successfulDeliveries = deliveries.filter(d => d.status === 'SUCCESS').length;
      const failedDeliveries = deliveries.filter(d => d.status === 'FAILED').length;
      const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING').length;

      return {
        id: event.id,
        eventType: event.eventType,
        serviceId: event.serviceId,
        approvalId: event.approvalId,
        approval: event.approval,
        payload: event.payload,
        createdAt: event.createdAt,
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
    logServiceRequest(authContext.serviceId, 'GET', '/api/service/events', 200, responseTime);

    return NextResponse.json({
      success: true,
      data: eventsWithStats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST - Trigger event manually
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'events:create')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      eventType,
      approvalId,
      payload,
    } = body;

    // Validate required fields
    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEvents = [
      'approval.created',
      'approval.updated',
      'approval.approved',
      'approval.rejected',
      'approval.cancelled',
      'approval.escalated',
      'approval.delegated',
    ];

    if (!validEvents.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type: ${eventType}` },
        { status: 400 }
      );
    }

    // Validate approval exists if approvalId is provided
    if (approvalId) {
      const approval = await prisma.serviceApproval.findFirst({
        where: {
          id: approvalId,
          serviceId: authContext.serviceId,
        },
      });

      if (!approval) {
        return NextResponse.json(
          { error: 'Approval not found' },
          { status: 404 }
        );
      }
    }

    // Create event
    const event = await prisma.webhookEvent.create({
      data: {
        service: {
          connect: { id: authContext.serviceId }
        },
        eventType,
        approval: approvalId ? {
          connect: { id: approvalId }
        } : undefined,
        triggeredBy: undefined, // Events from service API don't have a specific user trigger
        payload: payload || {
          eventType,
          serviceId: authContext.serviceId,
          serviceName: authContext.serviceName,
          timestamp: new Date().toISOString(),
        },
      },
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'POST', '/api/service/events', 201, responseTime);

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        eventType: event.eventType,
        serviceId: event.serviceId,
        approvalId: event.approvalId,
        payload: event.payload,
        createdAt: event.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
} 