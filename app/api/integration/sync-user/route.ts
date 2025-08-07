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

    console.log(`🔄 Syncing user ${emp_code} from TIPA Mobile to UXOne...`)

    // Sync user from TIPA Mobile to UXOne
    const syncedUser = await syncUserFromTIPA(emp_code)

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

          console.log(`✅ Successfully synced user ${emp_code}`)

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