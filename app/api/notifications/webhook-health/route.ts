import { NextResponse } from "next/server";
import { checkTIPAWebhookHealth } from "@/lib/webhook-sender";

export async function GET() {
  try {
    // Check TIPA Mobile webhook health
    const health = await checkTIPAMobileWebhookHealth();
    
    if (health.isHealthy) {
      // TIPA Mobile webhook is healthy
      return NextResponse.json({
        status: 'healthy',
        service: 'tipa-mobile-webhook',
        responseTime: health.responseTime,
        timestamp: new Date().toISOString()
      });
    } else {
      // TIPA Mobile webhook is unhealthy
      return NextResponse.json({
        status: 'unhealthy',
        service: 'tipa-mobile-webhook',
        error: health.error,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  } catch (error) {
    // Handle webhook health check error silently
    return NextResponse.json({
      status: 'error',
      service: 'tipa-mobile-webhook',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 