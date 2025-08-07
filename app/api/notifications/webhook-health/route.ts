import { NextResponse } from "next/server";
import { checkTIPAWebhookHealth } from "@/lib/webhook-sender";

export async function GET() {
  try {
    console.log('🏥 UXOne: Checking TIPA Mobile webhook health...')
    
    const health = await checkTIPAWebhookHealth()
    
    if (health.healthy) {
      console.log(`✅ UXOne: TIPA Mobile webhook is healthy (${health.responseTime}ms)`)
      return NextResponse.json({
        status: 'healthy',
        service: 'tipa-mobile-webhook',
        responseTime: `${health.responseTime}ms`,
        message: 'TIPA Mobile webhook is responding correctly'
      })
    } else {
      console.log(`❌ UXOne: TIPA Mobile webhook is unhealthy: ${health.error}`)
      return NextResponse.json({
        status: 'unhealthy',
        service: 'tipa-mobile-webhook',
        error: health.error,
        message: 'TIPA Mobile webhook is not responding correctly'
      }, { status: 503 })
    }
  } catch (error) {
    console.error('❌ UXOne: Webhook health check failed:', error)
    return NextResponse.json({
      status: 'error',
      service: 'tipa-mobile-webhook',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check TIPA Mobile webhook health'
    }, { status: 500 })
  }
} 