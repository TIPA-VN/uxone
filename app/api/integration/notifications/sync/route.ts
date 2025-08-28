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

    let result;
    
    if (markAsRead && notificationId) {
      result = await markNotificationAsRead(notificationId, isRead)
    } else if (direction === 'bidirectional') {
      result = await syncNotificationsBidirectional(userId)
    } else if (direction === 'uxone-to-tipa') {
      result = await syncNotificationsToTIPA(userId)
    } else {
      result = await syncNotificationsEnhanced(userId)
    }

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Error syncing notifications:', error)
    return NextResponse.json(
      { error: 'Failed to sync notifications' },
      { status: 500 }
    )
  }
} 