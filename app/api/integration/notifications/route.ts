import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-middleware'
import { getUXOnePrisma, getTIPAPrisma } from '@/lib/database-integration'

export const runtime = 'nodejs'

// GET /api/integration/notifications - Get notifications from both systems
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const read = searchParams.get('read')
    const emp_code = searchParams.get('empCode')
    const source = searchParams.get('source') || 'auto' // 'uxone', 'tipa', or 'auto'

    // Handle different authentication methods
    let authenticatedUserId = userId

    // If empCode is provided, authenticate and get user
    if (emp_code && !userId) {
      const password = request.headers.get('x-password')
      if (password) {
        const user = await authenticateUser(emp_code, password)
        if (user) {
          authenticatedUserId = user.id
        } else {
          return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 401 }
          )
        }
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'userId or empCode is required' },
        { status: 400 }
      )
    }

    let notifications: Array<Record<string, unknown> & { source: string }> = []

    if (source === 'uxone' || source === 'auto') {
      try {
        // Get notifications from UXOne database
        const uxonePrisma = await getUXOnePrisma()
        
        const whereClause: { userId: string; hidden: boolean; read?: boolean } = {
          userId: authenticatedUserId,
          hidden: false
        }

        if (read !== null && read !== undefined) {
          whereClause.read = read === 'true'
        }

        const uxoneNotifications = await uxonePrisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit
        })

        notifications = [...notifications, ...uxoneNotifications.map(n => ({
          ...n,
          source: 'uxone'
        }))]

      } catch (error) {
        console.error('Error fetching UXOne notifications:', error)
        if (source === 'uxone') {
          return NextResponse.json(
            { error: 'Failed to fetch UXOne notifications' },
            { status: 500 }
          )
        }
      }
    }

    if (source === 'tipa' || source === 'auto') {
      try {
        // Get notifications from TIPA Mobile database
        const tipaPrisma = await getTIPAPrisma()
        
        const whereClause: { userId: string; hidden: boolean; read?: boolean } = {
          userId: authenticatedUserId,
          hidden: false
        }

        if (read !== null && read !== undefined) {
          whereClause.read = read === 'true'
        }

        const tipaNotifications = await tipaPrisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit
        })

        notifications = [...notifications, ...tipaNotifications.map(n => ({
          ...n,
          source: 'tipa'
        }))]

      } catch (error) {
        console.error('Error fetching TIPA notifications:', error)
        if (source === 'tipa') {
          return NextResponse.json(
            { error: 'Failed to fetch TIPA notifications' },
            { status: 500 }
          )
        }
      }
    }

    // Sort notifications by creation date (newest first)
    notifications.sort((a, b) => {
      const dateA = new Date(a.createdAt as string).getTime()
      const dateB = new Date(b.createdAt as string).getTime()
      return dateB - dateA
    })

    // Apply limit to final result
    const limitedNotifications = notifications.slice(0, limit)

    return NextResponse.json({
      success: true,
      count: limitedNotifications.length,
      notifications: limitedNotifications,
      source
    })

  } catch (error) {
    console.error('Error fetching cross-system notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/integration/notifications - Create notification in both systems
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, empCode: emp_code, title, message, type, link, targetSystem = 'both' } = body

    // Handle authentication
    let authenticatedUserId = userId
    if (emp_code && !userId) {
      const password = request.headers.get('x-password')
      if (password) {
        const user = await authenticateUser(emp_code, password)
        if (user) {
          authenticatedUserId = user.id
        } else {
          return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 401 }
          )
        }
      }
    }

    if (!authenticatedUserId || !title || !message) {
      return NextResponse.json(
        { error: 'userId (or empCode), title, and message are required' },
        { status: 400 }
      )
    }

    // Create notification in UXOne
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        userId: authenticatedUserId,
        type: type || 'info',
        link: link || null,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      notification,
      message: 'Notification created successfully'
    })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}