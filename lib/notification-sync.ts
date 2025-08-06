import { PrismaClient } from '@prisma/client'
import { getUXOnePrisma, getTIPAPrisma } from './database-integration'

// Force Node.js runtime
export const runtime = 'nodejs'

// Notification sync status tracking
interface SyncStatus {
  totalNotifications: number
  syncedNotifications: number
  skippedNotifications: number
  errors: string[]
}

// Enhanced notification synchronization with detailed tracking
export async function syncNotificationsEnhanced(userId: string): Promise<SyncStatus> {
  const syncStatus: SyncStatus = {
    totalNotifications: 0,
    syncedNotifications: 0,
    skippedNotifications: 0,
    errors: []
  }

  try {
    const tipaPrisma = await getTIPAPrisma()
    const uxonePrisma = await getUXOnePrisma()

    console.log(`🔄 Starting notification sync for user ${userId}`)

    // Get notifications from TIPA Mobile database
    const tipaNotifications = await tipaPrisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100 // Increased limit for better sync
    })

    syncStatus.totalNotifications = tipaNotifications.length
    console.log(`📊 Found ${tipaNotifications.length} notifications in TIPA Mobile`)

    // Sync each notification to UXOne database
    for (const tipaNotif of tipaNotifications) {
      try {
        // Check if notification already exists in UXOne
        const existingNotif = await uxonePrisma.notification.findFirst({
          where: { 
            userId,
            title: tipaNotif.title,
            createdAt: tipaNotif.createdAt
          }
        })

        if (!existingNotif) {
          // Create new notification in UXOne
          await uxonePrisma.notification.create({
            data: {
              userId,
              title: tipaNotif.title,
              message: tipaNotif.message,
              link: tipaNotif.link,
              type: tipaNotif.type,
              read: tipaNotif.read,
              hidden: tipaNotif.hidden
            }
          })
          syncStatus.syncedNotifications++
          console.log(`✅ Synced notification: ${tipaNotif.title}`)
        } else {
          // Update existing notification if needed
          if (existingNotif.read !== tipaNotif.read || existingNotif.hidden !== tipaNotif.hidden) {
            await uxonePrisma.notification.update({
              where: { id: existingNotif.id },
              data: {
                read: tipaNotif.read,
                hidden: tipaNotif.hidden
              }
            })
            syncStatus.syncedNotifications++
            console.log(`🔄 Updated notification: ${tipaNotif.title}`)
          } else {
            syncStatus.skippedNotifications++
          }
        }
      } catch (error) {
        const errorMsg = `Failed to sync notification ${tipaNotif.id}: ${error}`
        syncStatus.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    console.log(`✅ Notification sync completed for user ${userId}`)
    console.log(`📊 Sync Summary: ${syncStatus.syncedNotifications} synced, ${syncStatus.skippedNotifications} skipped, ${syncStatus.errors.length} errors`)

  } catch (error) {
    const errorMsg = `Notification sync failed for user ${userId}: ${error}`
    syncStatus.errors.push(errorMsg)
    console.error(errorMsg)
  }

  return syncStatus
}

// Sync notifications from UXOne to TIPA Mobile
export async function syncNotificationsToTIPA(userId: string): Promise<SyncStatus> {
  const syncStatus: SyncStatus = {
    totalNotifications: 0,
    syncedNotifications: 0,
    skippedNotifications: 0,
    errors: []
  }

  try {
    const tipaPrisma = await getTIPAPrisma()
    const uxonePrisma = await getUXOnePrisma()

    console.log(`🔄 Starting UXOne to TIPA notification sync for user ${userId}`)

    // Get notifications from UXOne database
    const uxoneNotifications = await uxonePrisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    syncStatus.totalNotifications = uxoneNotifications.length
    console.log(`📊 Found ${uxoneNotifications.length} notifications in UXOne`)

    // Sync each notification to TIPA Mobile database
    for (const uxoneNotif of uxoneNotifications) {
      try {
        // Check if notification already exists in TIPA Mobile
        const existingNotif = await tipaPrisma.notification.findFirst({
          where: { 
            userId,
            title: uxoneNotif.title,
            createdAt: uxoneNotif.createdAt
          }
        })

        if (!existingNotif) {
          // Create new notification in TIPA Mobile
          await tipaPrisma.notification.create({
            data: {
              userId,
              title: uxoneNotif.title,
              message: uxoneNotif.message,
              link: uxoneNotif.link,
              type: uxoneNotif.type,
              read: uxoneNotif.read,
              hidden: uxoneNotif.hidden
            }
          })
          syncStatus.syncedNotifications++
          console.log(`✅ Synced UXOne notification to TIPA: ${uxoneNotif.title}`)
        } else {
          syncStatus.skippedNotifications++
        }
      } catch (error) {
        const errorMsg = `Failed to sync UXOne notification ${uxoneNotif.id}: ${error}`
        syncStatus.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    console.log(`✅ UXOne to TIPA notification sync completed for user ${userId}`)

  } catch (error) {
    const errorMsg = `UXOne to TIPA notification sync failed for user ${userId}: ${error}`
    syncStatus.errors.push(errorMsg)
    console.error(errorMsg)
  }

  return syncStatus
}

// Bidirectional notification sync
export async function syncNotificationsBidirectional(userId: string): Promise<{
  tipaToUXOne: SyncStatus
  uxoneToTIPA: SyncStatus
}> {
  console.log(`🔄 Starting bidirectional notification sync for user ${userId}`)

  const tipaToUXOne = await syncNotificationsEnhanced(userId)
  const uxoneToTIPA = await syncNotificationsToTIPA(userId)

  console.log(`✅ Bidirectional sync completed for user ${userId}`)
  console.log(`📊 TIPA → UXOne: ${tipaToUXOne.syncedNotifications} synced`)
  console.log(`📊 UXOne → TIPA: ${uxoneToTIPA.syncedNotifications} synced`)

  return { tipaToUXOne, uxoneToTIPA }
}

// Mark notification as read across both systems
export async function markNotificationAsRead(userId: string, notificationId: string, isRead: boolean = true): Promise<boolean> {
  try {
    const tipaPrisma = await getTIPAPrisma()
    const uxonePrisma = await getUXOnePrisma()

    console.log(`📝 Marking notification ${notificationId} as ${isRead ? 'read' : 'unread'} for user ${userId}`)

    // Update in TIPA Mobile database
    await tipaPrisma.notification.updateMany({
      where: { 
        id: notificationId,
        userId 
      },
      data: { read: isRead }
    })

    // Update in UXOne database
    await uxonePrisma.notification.updateMany({
      where: { 
        id: notificationId,
        userId 
      },
      data: { read: isRead }
    })

    console.log(`✅ Successfully marked notification as ${isRead ? 'read' : 'unread'} in both systems`)
    return true

  } catch (error) {
    console.error(`❌ Failed to mark notification as read: ${error}`)
    return false
  }
}

// Get notification count across both systems
export async function getNotificationCounts(userId: string): Promise<{
  tipaCount: number
  uxoneCount: number
  unreadTIPA: number
  unreadUXOne: number
}> {
  try {
    const tipaPrisma = await getTIPAPrisma()
    const uxonePrisma = await getUXOnePrisma()

    // Get counts from TIPA Mobile
    const tipaCount = await tipaPrisma.notification.count({
      where: { userId }
    })

    const unreadTIPA = await tipaPrisma.notification.count({
      where: { 
        userId,
        read: false
      }
    })

    // Get counts from UXOne
    const uxoneCount = await uxonePrisma.notification.count({
      where: { userId }
    })

    const unreadUXOne = await uxonePrisma.notification.count({
      where: { 
        userId,
        read: false
      }
    })

    return {
      tipaCount,
      uxoneCount,
      unreadTIPA,
      unreadUXOne
    }

  } catch (error) {
    console.error(`❌ Failed to get notification counts: ${error}`)
    return {
      tipaCount: 0,
      uxoneCount: 0,
      unreadTIPA: 0,
      unreadUXOne: 0
    }
  }
}

// Clean up old notifications (older than 30 days)
export async function cleanupOldNotifications(userId: string, daysOld: number = 30): Promise<{
  tipaCleaned: number
  uxoneCleaned: number
}> {
  try {
    const tipaPrisma = await getTIPAPrisma()
    const uxonePrisma = await getUXOnePrisma()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    console.log(`🧹 Cleaning up notifications older than ${daysOld} days for user ${userId}`)

    // Clean up TIPA Mobile notifications
    const tipaResult = await tipaPrisma.notification.deleteMany({
      where: {
        userId,
        createdAt: {
          lt: cutoffDate
        },
        read: true // Only delete read notifications
      }
    })

    // Clean up UXOne notifications
    const uxoneResult = await uxonePrisma.notification.deleteMany({
      where: {
        userId,
        createdAt: {
          lt: cutoffDate
        },
        read: true // Only delete read notifications
      }
    })

    console.log(`✅ Cleaned up ${tipaResult.count} TIPA notifications and ${uxoneResult.count} UXOne notifications`)

    return {
      tipaCleaned: tipaResult.count,
      uxoneCleaned: uxoneResult.count
    }

  } catch (error) {
    console.error(`❌ Failed to cleanup old notifications: ${error}`)
    return {
      tipaCleaned: 0,
      uxoneCleaned: 0
    }
  }
} 