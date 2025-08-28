import { NextRequest, NextResponse } from 'next/server'
import { syncUserFromTIPA, syncNotifications } from '@/lib/database-integration'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { empCode: emp_code, syncNotifications: shouldSyncNotifications } = body

    if (!emp_code) {
      return NextResponse.json(
        { error: 'empCode is required' },
        { status: 400 }
      )
    }

    // Sync user from TIPA Mobile
    const user = await syncUserFromTIPA(emp_code)
    
    let notificationResult = null
    if (shouldSyncNotifications && user) {
      notificationResult = await syncNotifications(user.id)
    }

    return NextResponse.json({
      success: true,
      user,
      notifications: notificationResult,
      message: 'User synced successfully'
    })

  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    )
  }
} 