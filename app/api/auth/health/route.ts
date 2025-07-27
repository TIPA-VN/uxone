import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // This endpoint should be implemented by the central authentication service
    // For now, we'll return a simple health check
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'central-auth'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    )
  }
} 