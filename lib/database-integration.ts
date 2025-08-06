import { PrismaClient } from '@prisma/client'

// Force Node.js runtime
export const runtime = 'nodejs'

// UXOne Database Client
let uxonePrisma: PrismaClient | null = null
// TIPA Mobile Database Client  
let tipaPrisma: PrismaClient | null = null

// Initialize UXOne database connection
export async function getUXOnePrisma(): Promise<PrismaClient> {
  if (!uxonePrisma) {
    uxonePrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.UXONE_DATABASE_URL
        }
      }
    })
  }
  return uxonePrisma
}

// Initialize TIPA Mobile database connection
export async function getTIPAPrisma(): Promise<PrismaClient> {
  if (!tipaPrisma) {
    tipaPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
  }
  return tipaPrisma
}

// Sync user from TIPA Mobile to UXOne (with central API role mapping)
export async function syncUserFromTIPA(empCode: string, centralApiData?: any) {
  try {
    const tipaPrisma = await getTIPAPrisma()
    const uxonePrisma = await getUXOnePrisma()

    // Get user from TIPA Mobile database
    const tipaUser = await tipaPrisma.user.findFirst({
      where: { 
        OR: [
          { username: empCode },
          { empCode: empCode }
        ]
      }
    })

    if (!tipaUser) {
      console.log(`User ${empCode} not found in TIPA Mobile database`)
      return null
    }

    // Check if user exists in UXOne database
    const uxoneUser = await uxonePrisma.user.findFirst({
      where: { username: empCode }
    })

    // Determine role - use central API data if available, otherwise use TIPA Mobile data
    let role = 'STAFF'
    if (centralApiData && centralApiData.emp_pos) {
      // Map emp_pos to role using the mapping function
      const { mapPositionToRole } = await import('./auth-middleware')
      role = mapPositionToRole(centralApiData.emp_pos)
    } else {
      role = tipaUser.role || 'STAFF'
    }

    if (uxoneUser) {
      // Update existing user
      const updatedUser = await uxonePrisma.user.update({
        where: { id: uxoneUser.id },
        data: {
          name: tipaUser.name,
          email: tipaUser.email,
          department: tipaUser.department,
          centralDepartment: tipaUser.centralDepartment,
          departmentName: tipaUser.departmentName,
          role: role, // Use mapped role from central API or TIPA Mobile
          isActive: tipaUser.isActive,
          updatedAt: new Date()
        }
      })
      console.log(`✅ Updated user ${empCode} in UXOne database with role: ${role}`)
      return updatedUser
    } else {
      // Create new user in UXOne
      const newUser = await uxonePrisma.user.create({
        data: {
          username: tipaUser.username,
          name: tipaUser.name,
          email: tipaUser.email,
          department: tipaUser.department || 'OPS',
          centralDepartment: tipaUser.centralDepartment,
          departmentName: tipaUser.departmentName,
          role: role, // Use mapped role from central API or TIPA Mobile
          isActive: tipaUser.isActive,
          hashedPassword: tipaUser.hashedPassword || ''
        }
      })
      console.log(`✅ Created user ${empCode} in UXOne database with role: ${role}`)
      return newUser
    }
  } catch (error) {
    console.error('Error syncing user from TIPA Mobile:', error)
    return null
  }
}

// Sync user from central API to UXOne (with role mapping)
export async function syncUserFromCentralAPI(centralApiData: any) {
  try {
    const uxonePrisma = await getUXOnePrisma()
    
    // Map emp_pos to role using the mapping function
    const { mapPositionToRole } = await import('./auth-middleware')
    const role = mapPositionToRole(centralApiData.emp_pos)

    // Check if user exists in UXOne database
    const uxoneUser = await uxonePrisma.user.findFirst({
      where: { username: centralApiData.emp_code }
    })

    if (uxoneUser) {
      // Update existing user
      const updatedUser = await uxonePrisma.user.update({
        where: { id: uxoneUser.id },
        data: {
          name: centralApiData.emp_name,
          email: centralApiData.email || `${centralApiData.emp_code}@tipa.co.th`,
          centralDepartment: centralApiData.emp_dept,
          departmentName: centralApiData.emp_dept_name,
          role: role, // Use mapped role from emp_pos
          isActive: true,
          updatedAt: new Date()
        }
      })
      console.log(`✅ Updated user ${centralApiData.emp_code} in UXOne database with role: ${role}`)
      return updatedUser
    } else {
      // Create new user in UXOne
      const newUser = await uxonePrisma.user.create({
        data: {
          username: centralApiData.emp_code,
          name: centralApiData.emp_name,
          email: centralApiData.email || `${centralApiData.emp_code}@tipa.co.th`,
          department: 'OPS', // Default department for new users
          centralDepartment: centralApiData.emp_dept,
          departmentName: centralApiData.emp_dept_name,
          role: role, // Use mapped role from emp_pos
          isActive: true
        }
      })
      console.log(`✅ Created new user ${centralApiData.emp_code} in UXOne database with role: ${role}`)
      return newUser
    }
  } catch (error) {
    console.error('Error syncing user from Central API:', error)
    return null
  }
}

// Sync notifications between databases
export async function syncNotifications(userId: string) {
  try {
    const tipaPrisma = await getTIPAPrisma()
    const uxonePrisma = await getUXOnePrisma()

    // Get notifications from TIPA Mobile
    const tipaNotifications = await tipaPrisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent notifications
    })

    // Sync to UXOne database
    for (const tipaNotif of tipaNotifications) {
      const existingNotif = await uxonePrisma.notification.findFirst({
        where: { 
          userId,
          title: tipaNotif.title,
          createdAt: tipaNotif.createdAt
        }
      })

      if (!existingNotif) {
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
      }
    }

    console.log(`✅ Synced ${tipaNotifications.length} notifications for user ${userId}`)
  } catch (error) {
    console.error('Error syncing notifications:', error)
  }
}

// Cleanup database connections
export async function cleanupConnections() {
  if (uxonePrisma) {
    await uxonePrisma.$disconnect()
    uxonePrisma = null
  }
  if (tipaPrisma) {
    await tipaPrisma.$disconnect()
    tipaPrisma = null
  }
} 