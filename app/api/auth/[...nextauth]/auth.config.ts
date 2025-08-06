import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { hashPassword, verifyPassword } from '@/lib/hashPassword'
import { authenticateUser, mapPositionToRole } from '@/lib/auth-middleware'

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

// Check if central API is available
async function isCentralApiAvailable(): Promise<boolean> {
  try {
    // Just check if the endpoint is reachable with a simple request
          const response = await fetch(process.env.CENTRAL_API_URL || "http://10.116.3.138:8888/api/web_check_login", {
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

          // Central API is available, use enhanced authentication
          const user = await authenticateUser(
            credentials.username as string, 
            credentials.password as string
          )

          if (!user) {
            throw new Error('Invalid credentials')
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error('User account is disabled. Please contact your administrator.')
          }

          // Check if this user should have admin override
          const isAdminOverride = shouldOverrideToAdmin(user.username);
          
          const mappedRole = mapPositionToRole(user.departmentName || 'STAFF');
          const finalRole = isAdminOverride ? 'ADMIN' : (user.role || mappedRole);

          // Update user role if needed
          if (user.role !== finalRole) {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();
            await prisma.user.update({
              where: { id: user.id },
              data: { role: finalRole }
            });
            await prisma.$disconnect();
            user.role = finalRole;
          }

          return {
            id: user.id,
            name: user.name || user.username,
            email: user.email || `${user.username}@tipa.co.th`,
            username: user.username,
            department: user.department || 'OPS',
            centralDepartment: user.centralDepartment || 'UNKNOWN',
            departmentName: user.departmentName || 'Unknown Department',
            role: user.role || 'STAFF',
            position: user.departmentName || 'Unknown Department',
            isFallbackAuth: false,
          }
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