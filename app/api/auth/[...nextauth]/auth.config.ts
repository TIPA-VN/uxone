import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { hashPassword, verifyPassword } from '@/lib/hashPassword'

export const runtime = 'nodejs'

// Admin fallback credentials (should be set in environment variables)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_FALLBACK_USERNAME || 'admin',
  password: process.env.ADMIN_FALLBACK_PASSWORD || 'admin123',
  role: process.env.ADMIN_FALLBACK_ROLE || 'GENERAL DIRECTOR',
  name: process.env.ADMIN_FALLBACK_NAME || 'System Administrator',
  email: process.env.ADMIN_FALLBACK_EMAIL || 'admin@tipa.co.th',
  department: process.env.ADMIN_FALLBACK_DEPARTMENT || 'IT',
  departmentName: process.env.ADMIN_FALLBACK_DEPARTMENT_NAME || 'Information Technology'
}

// Test accounts for development
const TEST_ACCOUNTS = [
  {
    username: 'procurement',
    password: 'proc1234',
    role: 'MANAGER',
    name: 'Procurement Manager',
    email: 'procurement@tipa.co.th',
    department: 'PROC',
    departmentName: 'Procurement'
  },
  {
    username: 'procurement_staff',
    password: 'proc1234',
    role: 'STAFF',
    name: 'Procurement Staff',
    email: 'procurement.staff@tipa.co.th',
    department: 'PROC',
    departmentName: 'Procurement'
  }
];

// Admin override list - usernames that should always have admin access
const ADMIN_OVERRIDE_USERS = [
  'administrator', // Your username
  'admin',
  //'22023312', // Add your actual username here
  // Add more admin usernames as needed
];

// Check if a user should have admin override
function shouldOverrideToAdmin(username: string): boolean {
  return ADMIN_OVERRIDE_USERS.includes(username.toLowerCase());
}

// Map central API positions to our role system
function mapPositionToRole(position: string): string {
  // Normalize the position to uppercase for consistent matching
  const normalizedPosition = position?.toUpperCase().trim();
  
  const positionMap: { [key: string]: string } = {
    // System Administrator
    'ADMIN': 'ADMIN',
    
    // Executive Level
    'GENERAL DIRECTOR': 'GENERAL_DIRECTOR',
    'GENERAL MANAGER': 'GENERAL_MANAGER',
    'ASSISTANT GENERAL MANAGER': 'ASSISTANT_GENERAL_MANAGER',
    'ASSISTANT GENERAL MANAGER 2': 'ASSISTANT_GENERAL_MANAGER_2',
    
    // Senior Management
    'SENIOR MANAGER': 'SENIOR_MANAGER',
    'SENIOR MANAGER 2': 'SENIOR_MANAGER_2',
    'ASSISTANT SENIOR MANAGER': 'ASSISTANT_SENIOR_MANAGER',
    
    // Management
    'MANAGER': 'MANAGER',
    'MANAGER 2': 'MANAGER_2',
    'ASSISTANT MANAGER': 'ASSISTANT_MANAGER',
    'ASSISTANT MANAGER 2': 'ASSISTANT_MANAGER_2',
    
    // Supervision
    'SUPERVISOR': 'SUPERVISOR',
    'SUPERVISOR 2': 'SUPERVISOR_2',
    'LINE LEADER': 'LINE_LEADER',
    
    // Technical Specialists
    'CHIEF SPECIALIST': 'CHIEF_SPECIALIST',
    'SENIOR SPECIALIST': 'SENIOR_SPECIALIST',
    'SENIOR SPECIALIST 2': 'SENIOR_SPECIALIST_2',
    'TECHNICAL SPECIALIST': 'TECHNICAL_SPECIALIST',
    'SPECIALIST': 'SPECIALIST',
    'SPECIALIST 2': 'SPECIALIST_2',
    'SENIOR ENGINEER': 'SENIOR_ENGINEER',
    'ENGINEER': 'ENGINEER',
    
    // Staff Level
    'SENIOR STAFF': 'SENIOR_STAFF',
    'STAFF': 'STAFF',
    'SENIOR ASSOCIATE': 'SENIOR_ASSOCIATE',
    'ASSOCIATE': 'ASSOCIATE',
    
    // Operations
    'SENIOR OPERATOR': 'SENIOR_OPERATOR',
    'OPERATOR': 'OPERATOR',
    'TECHNICIAN': 'TECHNICIAN',
    
    // Entry Level
    'INTERN': 'INTERN',
  };
  
  // Return mapped role or default to STAFF if position not found
  return positionMap[normalizedPosition] || 'STAFF';
}

// Check if central API is available
async function isCentralApiAvailable(): Promise<boolean> {
  try {
    // Just check if the endpoint is reachable with a simple request
    const response = await fetch("http://10.116.3.138:8888/api/web_check_login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username: "test", 
        password: "test" 
      }),
      signal: AbortSignal.timeout(5000)
    })
    
    // If we get any response (even 401 for wrong credentials), the API is available
    return true
  } catch (error) {
    return false
  }
}

// Validate admin credentials
async function validateAdminCredentials(username: string, password: string): Promise<boolean> {
  // Check if credentials match admin fallback
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    return true
  }
  
  // Also check against hashed password if provided
  if (process.env.ADMIN_FALLBACK_HASHED_PASSWORD) {
    return await verifyPassword(password, process.env.ADMIN_FALLBACK_HASHED_PASSWORD)
  }
  
  return false
}

// Validate test account credentials
function validateTestCredentials(username: string, password: string): any {
  const testAccount = TEST_ACCOUNTS.find(account => 
    account.username === username && account.password === password
  );
  
  return testAccount || null;
}

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        try {
          // First, check if central API is available
          const centralApiAvailable = await isCentralApiAvailable()
          
          // If central API is down, check for admin fallback authentication and test accounts
          if (!centralApiAvailable) {
              const isAdmin = await validateAdminCredentials(
                credentials.username as string, 
                credentials.password as string
              )
              
              if (isAdmin) {
                
                // Create a virtual admin user without database access
                const virtualAdminUser = {
                  id: 'admin-fallback-' + Date.now(),
                  username: ADMIN_CREDENTIALS.username,
                  name: ADMIN_CREDENTIALS.name,
                  email: ADMIN_CREDENTIALS.email,
                  department: ADMIN_CREDENTIALS.department,
                  departmentName: ADMIN_CREDENTIALS.departmentName,
                  role: ADMIN_CREDENTIALS.role,
                  hashedPassword: process.env.ADMIN_FALLBACK_HASHED_PASSWORD || '',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };

                return {
                  id: virtualAdminUser.id,
                  name: virtualAdminUser.name || virtualAdminUser.username,
                  email: virtualAdminUser.email || `${virtualAdminUser.username}@tipa.co.th`,
                  username: virtualAdminUser.username,
                  department: virtualAdminUser.department || 'IT',
                  centralDepartment: virtualAdminUser.department || 'IT',
                  departmentName: virtualAdminUser.departmentName || 'Information Technology',
                  role: virtualAdminUser.role || 'GENERAL DIRECTOR',
                  position: virtualAdminUser.departmentName || 'Information Technology',
                  isFallbackAuth: true, // Flag to indicate fallback authentication
                }
              }
              
              // Check for test accounts
              const testAccount = validateTestCredentials(
                credentials.username as string, 
                credentials.password as string
              )
              
              if (testAccount) {
                return {
                  id: 'test-account-' + testAccount.username + '-' + Date.now(),
                  name: testAccount.name,
                  email: testAccount.email,
                  username: testAccount.username,
                  department: testAccount.department,
                  centralDepartment: testAccount.department,
                  departmentName: testAccount.departmentName,
                  role: testAccount.role,
                  position: testAccount.departmentName,
                  isFallbackAuth: true, // Flag to indicate fallback authentication
                }
              }
              
              throw new Error('Central authentication service is unavailable. Only admin and test accounts can access the system.')
            }

          // Central API is available, proceed with normal authentication
          const baseUrl = process.env.NEXTAUTH_URL || (process.env.NODE_ENV === 'production' ? 'http://10.116.2.72:8090' : 'http://localhost:3000')
          
          try {
            const response = await fetch(`${baseUrl}/api/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username: credentials.username,
                password: credentials.password,
              }),
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || data.content || data.message || 'Authentication failed')
            }

            if (data.message !== 'OK') {
              throw new Error(data.error || data.content || 'Invalid credentials')
            }

            if (!data.emp_code) {
              throw new Error('Missing employee code')
            }

            // Import Prisma only at runtime (Node.js only)
            const { prisma } = await import('@/lib/prisma');

            // Check if this user should have admin override
            const isAdminOverride = shouldOverrideToAdmin(data.emp_code);
            
            const mappedRole = mapPositionToRole(data.emp_pos);
            const finalRole = isAdminOverride ? 'ADMIN' : mappedRole;



            // Upsert the user in the local DB with the latest info from the central API
            await prisma.user.upsert({
              where: { username: data.emp_code },
              update: {
                name: data.emp_name || data.emp_code,
                email: data.email || `${data.emp_code}@tipa.co.th`,
                centralDepartment: data.emp_dept || 'UNKNOWN', // Always update central department
                departmentName: data.emp_dept_name || 'Unknown Department',
                role: finalRole, // Use admin override if applicable
                // Note: department field is NOT updated on subsequent logins
              },
              create: {
                username: data.emp_code,
                name: data.emp_name || data.emp_code,
                email: data.email || `${data.emp_code}@tipa.co.th`,
                department: 'OPS', // Default to Operations for new users
                centralDepartment: data.emp_dept || 'UNKNOWN', // Store central department
                departmentName: data.emp_dept_name || 'Unknown Department',
                role: finalRole, // Use admin override if applicable
                hashedPassword: '',
                isActive: true, // New users are active by default
              },
            });

            // Now fetch the user from the local DB
            const dbUser = await prisma.user.findUnique({ where: { username: data.emp_code } });
            if (!dbUser) throw new Error('User not found in local DB');

            // Check if user is active
            if (!dbUser.isActive) {
              throw new Error('User account is disabled. Please contact your administrator.');
            }

            const user = {
              id: dbUser.id, // Use the local DB user ID!
              name: dbUser.name || dbUser.username,
              email: dbUser.email || `${dbUser.username}@tipa.co.th`,
              username: dbUser.username,
              department: dbUser.department || 'OPS', // Local department (defaults to Operations)
              centralDepartment: dbUser.centralDepartment || 'UNKNOWN', // Central API department
              departmentName: dbUser.departmentName || 'Unknown Department',
              role: dbUser.role || 'USER',
              position: dbUser.departmentName || 'Unknown Department',
              isFallbackAuth: false, // Flag to indicate normal authentication
            }
      
            return user
          } catch (error) {
            // If normal authentication fails, check if this is an admin user for fallback
            
            const isAdmin = await validateAdminCredentials(
              credentials.username as string, 
              credentials.password as string
            )
            
            if (isAdmin) {
              
              // Create a virtual admin user without database access
              const virtualAdminUser = {
                id: 'admin-fallback-' + Date.now(),
                username: ADMIN_CREDENTIALS.username,
                name: ADMIN_CREDENTIALS.name,
                email: ADMIN_CREDENTIALS.email,
                department: ADMIN_CREDENTIALS.department,
                departmentName: ADMIN_CREDENTIALS.departmentName,
                role: ADMIN_CREDENTIALS.role,
                hashedPassword: process.env.ADMIN_FALLBACK_HASHED_PASSWORD || '',
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              return {
                id: virtualAdminUser.id,
                name: virtualAdminUser.name || virtualAdminUser.username,
                email: virtualAdminUser.email || `${virtualAdminUser.username}@tipa.co.th`,
                username: virtualAdminUser.username,
                department: virtualAdminUser.department || 'IT',
                departmentName: virtualAdminUser.departmentName || 'Information Technology',
                role: virtualAdminUser.role || 'GENERAL DIRECTOR',
                centralDepartment: virtualAdminUser.department || 'IT',
                position: virtualAdminUser.departmentName || 'Information Technology',
                isFallbackAuth: true, // Flag to indicate fallback authentication
              }
            }
            
            // Check for test accounts
            const testAccount = validateTestCredentials(
              credentials.username as string, 
              credentials.password as string
            )
            
            if (testAccount) {
              return {
                id: 'test-account-' + testAccount.username + '-' + Date.now(),
                name: testAccount.name,
                email: testAccount.email,
                username: testAccount.username,
                department: testAccount.department,
                centralDepartment: testAccount.department,
                departmentName: testAccount.departmentName,
                role: testAccount.role,
                position: testAccount.departmentName,
                isFallbackAuth: true, // Flag to indicate fallback authentication
              }
            }
            
            throw new Error('Authentication failed. Central service unavailable and user is not an admin or test account.')
          }
        } catch (error) {
          throw error
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // After successful sign in, redirect to LVM (department routing handled in main page)
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/lvm`
      }
      // Allows relative callback URLs
      else if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      return baseUrl
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.department = user.department
        token.centralDepartment = user.centralDepartment
        token.departmentName = user.departmentName
        token.position = user.position
        token.isFallbackAuth = user.isFallbackAuth
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          username: token.username as string,
          role: token.role as string,
          department: token.department as string,
          centralDepartment: token.centralDepartment as string,
          departmentName: token.departmentName as string,
          position: (token.position as string | null) || 'Unknown',
          isFallbackAuth: token.isFallbackAuth as boolean,
        }
      }
      return session
    },
  },
  trustHost: true,
} as const satisfies NextAuthConfig 