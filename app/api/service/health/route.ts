import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUXOnePrisma, getTIPAPrisma } from '@/lib/database-integration'

export const runtime = 'nodejs'

// GET /api/service/health - Comprehensive health check
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: { status: 'unknown', responseTime: 0 },
        serviceApps: { status: 'unknown', count: 0 },
        memory: { status: 'unknown', usage: 0, limit: 0 }
      }
    }

    // Check main database connection (UXOne database)
    try {
      const dbStart = Date.now()
      const uxonePrisma = await getUXOnePrisma()
      await uxonePrisma.$queryRaw`SELECT 1`
      healthChecks.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart
      }
    } catch (error) {
      const dbStart = Date.now() // Define dbStart for error case
      healthChecks.checks.database = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStart,
        error: error instanceof Error ? error.message : String(error)
      }
      healthChecks.status = 'degraded'
    }





    // Check service apps
    try {
      const uxonePrisma = await getUXOnePrisma()
      const serviceCount = await uxonePrisma.serviceApp.count({
        where: { isActive: true }
      })
      healthChecks.checks.serviceApps = {
        status: serviceCount > 0 ? 'healthy' : 'warning',
        count: serviceCount
      }
    } catch (error) {
      healthChecks.checks.serviceApps = {
        status: 'unhealthy',
        count: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage()
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const memoryLimitMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
    
    healthChecks.checks.memory = {
      status: memoryUsageMB > 500 ? 'warning' : 'healthy',
      usage: memoryUsageMB,
      limit: memoryLimitMB,
      percentage: Math.round((memoryUsageMB / memoryLimitMB) * 100)
    }

    // Overall response time
    const responseTime = Date.now() - startTime
    healthChecks.responseTime = responseTime

    // Determine final status
    const hasUnhealthy = Object.values(healthChecks.checks).some(
      check => (check as any).status === 'unhealthy'
    )
    const hasWarning = Object.values(healthChecks.checks).some(
      check => (check as any).status === 'warning'
    )

    if (hasUnhealthy) {
      healthChecks.status = 'unhealthy'
    } else if (hasWarning) {
      healthChecks.status = 'warning'
    }

    const statusCode = healthChecks.status === 'healthy' ? 200 : 
                      healthChecks.status === 'warning' ? 200 : 503

    return NextResponse.json(healthChecks, { status: statusCode })

  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
      responseTime
    }, { status: 503 })
  }
}

// GET /api/service/health/ping - Simple ping endpoint
export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}