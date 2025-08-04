import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../../../middleware';
import crypto from 'crypto';

export const runtime = 'nodejs';

// POST - Test webhook delivery
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'webhooks:manage')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: webhookId } = await params;

    // Get webhook details
    const webhook = await prisma.serviceWebhook.findFirst({
      where: {
        id: webhookId,
        serviceId: authContext.serviceId,
      },
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    if (!webhook.isActive) {
      return NextResponse.json({ error: 'Webhook is not active' }, { status: 400 });
    }

    // Create test event
    const testEvent = await prisma.webhookEvent.create({
      data: {
        service: {
          connect: { id: authContext.serviceId }
        },
        eventType: 'approval.created',
        payload: {
          eventType: 'approval.created',
          serviceId: authContext.serviceId,
          serviceName: authContext.serviceName,
          test: true,
          timestamp: new Date().toISOString(),
          message: 'This is a test webhook event',
        },
      },
    });

    // Create test payload
    const testPayload = {
      eventType: 'approval.created',
      serviceId: authContext.serviceId,
      serviceName: authContext.serviceName,
      test: true,
      timestamp: new Date().toISOString(),
      message: 'This is a test webhook event',
      webhookId: webhook.id,
      webhookName: webhook.name,
    };

    // Generate signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(testPayload))
      .digest('hex');

    // Send test webhook
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), webhook.timeout * 1000);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-UXOne-Signature': signature,
          'X-UXOne-Event': 'approval.created',
          'X-UXOne-Webhook-ID': webhook.id,
          'User-Agent': 'UXOne-Webhook/1.0',
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Create delivery record
      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhook: {
            connect: { id: webhook.id }
          },
          event: {
            connect: { id: testEvent.id }
          },
          status: response.ok ? 'SUCCESS' : 'FAILED',
          responseCode: response.status,
          responseBody: await response.text().catch(() => 'Unable to read response body'),
          attemptCount: 1,
          deliveredAt: response.ok ? new Date() : null,
        },
      });

      const responseTime = Date.now() - startTime;
      logServiceRequest(authContext.serviceId, 'POST', `/api/service/webhooks/${webhookId}/test`, 200, responseTime);

      return NextResponse.json({
        success: true,
        data: {
          webhookId: webhook.id,
          webhookName: webhook.name,
          url: webhook.url,
          status: response.ok ? 'SUCCESS' : 'FAILED',
          responseCode: response.status,
          responseTime: responseTime,
          deliveryId: delivery.id,
          signature: signature,
          payload: testPayload,
        },
      });

    } catch (error) {
      clearTimeout(timeoutId);

      // Create failed delivery record
      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhook: {
            connect: { id: webhook.id }
          },
          event: {
            connect: { id: testEvent.id }
          },
          status: 'FAILED',
          responseCode: null,
          responseBody: error instanceof Error ? error.message : 'Unknown error',
          attemptCount: 1,
          nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
        },
      });

      const responseTime = Date.now() - startTime;
      logServiceRequest(authContext.serviceId, 'POST', `/api/service/webhooks/${webhookId}/test`, 500, responseTime);

      return NextResponse.json({
        success: false,
        error: 'Webhook delivery failed',
        data: {
          webhookId: webhook.id,
          webhookName: webhook.name,
          url: webhook.url,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          deliveryId: delivery.id,
          signature: signature,
          payload: testPayload,
        },
      }, { status: 500 });

    }

  } catch (error) {
    console.error('Error testing webhook:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
} 