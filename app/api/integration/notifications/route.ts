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

    console.log(`🔍 Fetching notifications for user ${authenticatedUserId}, source: ${source}`)

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

        console.log(`✅ Found ${uxoneNotifications.length} notifications in UXOne`)
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

        console.log(`✅ Found ${tipaNotifications.length} notifications in TIPA Mobile`)
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

    console.log(`📊 Returning ${limitedNotifications.length} notifications from ${source}`)

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

    console.log(`📝 Creating notification for user ${authenticatedUserId} in ${targetSystem}`)

    const notificationData = {
      userId: authenticatedUserId,
      title,
      message,
      type: type || 'notification',
      link,
      read: false,
      hidden: false
    }

    const results: Record<string, unknown> = {}

    if (targetSystem === 'uxone' || targetSystem === 'both') {
      try {
        const uxonePrisma = await getUXOnePrisma()
        const uxoneNotification = await uxonePrisma.notification.create({
          data: notificationData
        })
        results.uxone = uxoneNotification
        console.log(`✅ Created notification in UXOne: ${title}`)
      } catch (error) {
        console.error('Error creating UXOne notification:', error)
        results.uxoneError = error
      }
    }

    if (targetSystem === 'tipa' || targetSystem === 'both') {
      try {
        const tipaPrisma = await getTIPAPrisma()
        const tipaNotification = await tipaPrisma.notification.create({
          data: notificationData
        })
        results.tipa = tipaNotification
        console.log(`✅ Created notification in TIPA Mobile: ${title}`)
      } catch (error) {
        console.error('Error creating TIPA notification:', error)
        results.tipaError = error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notification created',
      results
    })

  } catch (error) {
    console.error('Error creating cross-system notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

// PATCH /api/integration/notifications - Update notification in both systems
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, empCode: emp_code, notificationId, read, hidden, targetSystem = 'both' } = body

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

    if (!authenticatedUserId || !notificationId) {
      return NextResponse.json(
        { error: 'userId (or empCode) and notificationId are required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Updating notification ${notificationId} for user ${authenticatedUserId} in ${targetSystem}`)

    const updateData: Record<string, unknown> = {}
    if (read !== undefined) updateData.read = read
    if (hidden !== undefined) updateData.hidden = hidden

    const results: Record<string, unknown> = {}

    if (targetSystem === 'uxone' || targetSystem === 'both') {
      try {
        const uxonePrisma = await getUXOnePrisma()
        const uxoneNotification = await uxonePrisma.notification.update({
          where: { id: notificationId },
          data: updateData
        })
        results.uxone = uxoneNotification
        console.log(`✅ Updated notification in UXOne: ${notificationId}`)
      } catch (error) {
        console.error('Error updating UXOne notification:', error)
        results.uxoneError = error
      }
    }

    if (targetSystem === 'tipa' || targetSystem === 'both') {
      try {
        const tipaPrisma = await getTIPAPrisma()
        const tipaNotification = await tipaPrisma.notification.update({
          where: { id: notificationId },
          data: updateData
        })
        results.tipa = tipaNotification
        console.log(`✅ Updated notification in TIPA Mobile: ${notificationId}`)
      } catch (error) {
        console.error('Error updating TIPA notification:', error)
        results.tipaError = error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notification updated',
      results
    })

  } catch (error) {
    console.error('Error updating cross-system notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}