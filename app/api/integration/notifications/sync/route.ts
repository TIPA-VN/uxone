import { NextRequest, NextResponse } from 'next/server'
import { 
  syncNotificationsEnhanced, 
  syncNotificationsToTIPA, 
  syncNotificationsBidirectional,
  markNotificationAsRead,
  getNotificationCounts,
  cleanupOldNotifications
} from '@/lib/notification-sync'

export const runtime = 'nodejs'

// POST /api/integration/notifications/sync - Sync notifications from TIPA to UXOne
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, direction = 'tipa-to-uxone', markAsRead, notificationId, isRead } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Notification sync request for user ${userId}, direction: ${direction}`)

    let result: any

    switch (direction) {
      case 'tipa-to-uxone':
        result = await syncNotificationsEnhanced(userId)
        break
      
      case 'uxone-to-tipa':
        result = await syncNotificationsToTIPA(userId)
        break
      
      case 'bidirectional':
        result = await syncNotificationsBidirectional(userId)
        break
      
      case 'mark-read':
        if (!notificationId) {
          return NextResponse.json(
            { error: 'notificationId is required for mark-read operation' },
            { status: 400 }
          )
        }
        const success = await markNotificationAsRead(userId, notificationId, isRead ?? true)
        result = { success }
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid direction. Use: tipa-to-uxone, uxone-to-tipa, bidirectional, or mark-read' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Notification sync completed for direction: ${direction}`,
      result
    })

  } catch (error) {
    console.error('Error in notification sync:', error)
    return NextResponse.json(
      { error: 'Failed to sync notifications' },
      { status: 500 }
    )
  }
}

// GET /api/integration/notifications/counts - Get notification counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (action === 'cleanup') {
      const daysOld = parseInt(searchParams.get('daysOld') || '30')
      const result = await cleanupOldNotifications(userId, daysOld)
      
      return NextResponse.json({
        success: true,
        message: `Cleaned up old notifications`,
        result
      })
    }

    // Default action: get counts
    const counts = await getNotificationCounts(userId)
    
    return NextResponse.json({
      success: true,
      message: 'Notification counts retrieved',
      counts
    })

  } catch (error) {
    console.error('Error getting notification counts:', error)
    return NextResponse.json(
      { error: 'Failed to get notification counts' },
      { status: 500 }
    )
  }
} 