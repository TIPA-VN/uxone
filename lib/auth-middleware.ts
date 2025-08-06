import bcrypt from 'bcryptjs'
import { getUXOnePrisma, syncUserFromTIPA } from './database-integration'

// Force Node.js runtime for bcrypt and Prisma
export const runtime = 'nodejs'

// Enhanced authentication function that works with both databases
export async function authenticateUser(empCode: string, password: string) {
  try {
    // Hash the password using bcrypt (same as your current system)
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Call the central API (same endpoint as your current system)
    const centralApiResponse = await fetch(process.env.CENTRAL_API_URL || 'http://10.116.3.138:8888/api/web_check_login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'UXOne-App/1.0',
      },
      body: JSON.stringify({
        username: empCode,
        password: hashedPassword
      }),
    })

    if (!centralApiResponse.ok) {
      return null
    }

    const centralApiData = await centralApiResponse.json()
    
    if (centralApiData.message === 'OK' && centralApiData.emp_code) {
      // Get UXOne database connection
      const uxonePrisma = await getUXOnePrisma()
      
      // First, try to sync user from TIPA Mobile database
      const syncedUser = await syncUserFromTIPA(centralApiData.emp_code)
      
      if (syncedUser) {
        // User was synced from TIPA Mobile, return it
        return syncedUser
      }

      // If sync failed, try to find/create user directly in UXOne
      let user = await uxonePrisma.user.findFirst({
        where: { username: centralApiData.emp_code }
      })

      if (!user) {
        // Create new user in UXOne database
        user = await uxonePrisma.user.create({
          data: {
            username: centralApiData.emp_code,
            name: centralApiData.emp_name,
            email: centralApiData.email || `${centralApiData.emp_code}@tipa.co.th`,
            department: 'OPS', // Default department for new users
            centralDepartment: centralApiData.emp_dept,
            departmentName: centralApiData.emp_dept_name,
            role: 'STAFF', // Default role, will be mapped in auth config
            isActive: true
          }
        })
        console.log(`✅ Created new user ${centralApiData.emp_code} in UXOne database`)
      } else {
        // Update existing user with latest central API data
        user = await uxonePrisma.user.update({
          where: { id: user.id },
          data: {
            name: centralApiData.emp_name,
            email: centralApiData.email || `${centralApiData.emp_code}@tipa.co.th`,
            centralDepartment: centralApiData.emp_dept,
            departmentName: centralApiData.emp_dept_name,
            isActive: true,
            updatedAt: new Date()
          }
        })
        console.log(`✅ Updated user ${centralApiData.emp_code} in UXOne database`)
      }

      return user
    }

    return null
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

// Helper function to map central API position to role (from your existing auth config)
export function mapPositionToRole(position: string): string {
  const normalizedPosition = position?.toUpperCase().trim();
  
  const positionMap: { [key: string]: string } = {
    'ADMIN': 'ADMIN',
    'GENERAL DIRECTOR': 'GENERAL_DIRECTOR',
    'GENERAL MANAGER': 'GENERAL_MANAGER',
    'ASSISTANT GENERAL MANAGER': 'ASSISTANT_GENERAL_MANAGER',
    'ASSISTANT GENERAL MANAGER 2': 'ASSISTANT_GENERAL_MANAGER_2',
    'SENIOR MANAGER': 'SENIOR_MANAGER',
    'SENIOR MANAGER 2': 'SENIOR_MANAGER_2',
    'ASSISTANT SENIOR MANAGER': 'ASSISTANT_SENIOR_MANAGER',
    'MANAGER': 'MANAGER',
    'MANAGER 2': 'MANAGER_2',
    'ASSISTANT MANAGER': 'ASSISTANT_MANAGER',
    'ASSISTANT MANAGER 2': 'ASSISTANT_MANAGER_2',
    'SUPERVISOR': 'SUPERVISOR',
    'SUPERVISOR 2': 'SUPERVISOR_2',
    'LINE LEADER': 'LINE_LEADER',
    'CHIEF SPECIALIST': 'CHIEF_SPECIALIST',
    'SENIOR SPECIALIST': 'SENIOR_SPECIALIST',
    'SENIOR SPECIALIST 2': 'SENIOR_SPECIALIST_2',
    'TECHNICAL SPECIALIST': 'TECHNICAL_SPECIALIST',
    'SPECIALIST': 'SPECIALIST',
    'SPECIALIST 2': 'SPECIALIST_2',
    'SENIOR ENGINEER': 'SENIOR_ENGINEER',
    'ENGINEER': 'ENGINEER',
    'SENIOR STAFF': 'SENIOR_STAFF',
    'STAFF': 'STAFF',
    'SENIOR ASSOCIATE': 'SENIOR_ASSOCIATE',
    'ASSOCIATE': 'ASSOCIATE',
    'SENIOR OPERATOR': 'SENIOR_OPERATOR',
    'OPERATOR': 'OPERATOR',
    'TECHNICIAN': 'TECHNICIAN',
    'INTERN': 'INTERN',
  };
  
  return positionMap[normalizedPosition] || 'STAFF';
} 