import { NextRequest, NextResponse } from 'next/server'
import { syncUserFromTIPA, syncNotifications } from '@/lib/database-integration'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { empCode, syncNotifications: shouldSyncNotifications } = body

    if (!empCode) {
      return NextResponse.json(
        { error: 'empCode is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Syncing user ${empCode} from TIPA Mobile to UXOne...`)

    // Sync user from TIPA Mobile to UXOne
    const syncedUser = await syncUserFromTIPA(empCode)

    if (!syncedUser) {
      return NextResponse.json(
        { error: 'User not found in TIPA Mobile database' },
        { status: 404 }
      )
    }

    // Optionally sync notifications
    if (shouldSyncNotifications) {
      await syncNotifications(syncedUser.id)
    }

    console.log(`✅ Successfully synced user ${empCode}`)

    return NextResponse.json({
      success: true,
      message: 'User synced successfully',
      user: {
        id: syncedUser.id,
        username: syncedUser.username,
        name: syncedUser.name,
        email: syncedUser.email,
        department: syncedUser.department,
        role: syncedUser.role
      }
    })

  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    )
  }
} 