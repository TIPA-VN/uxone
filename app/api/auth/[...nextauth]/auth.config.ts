import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyPassword } from '@/lib/hashPassword'
import { authenticateUser, mapPositionToRole } from '@/lib/auth-middleware'

export const runtime = 'nodejs'

// Admin fallback credentials (should be set in environment variables)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_FALLBACK_USERNAME || 'admin',
  password: process.env.ADMIN_FALLBACK_PASSWORD || 'admin123',
  role: process.env.ADMIN_FALLBACK_ROLE || 'GENERAL DIRECTOR',
  name: process.env.ADMIN_FALLBACK_NAME || 'System Administrator',
  email: process.env.ADMIN_FALLBACK_EMAIL || 'admin@tipa.co.th',
  department: process.env.ADMIN_FALLBACK_DEPARTMENT || 'LEGAL',
  departmentName: process.env.ADMIN_FALLBACK_DEPARTMENT_NAME || 'Legal Department'
}

// Test accounts for emergency access when central API is completely down
// These are NOT accessible when central API is working
const TEST_ACCOUNTS = [
  {
    username: 'procurement',
    password: 'proc1234',
    role: 'MANAGER',
    name: 'Procurement Manager',
    email: 'procurement@tipa.co.th',
    department: 'LVM-PUR',
    departmentName: 'Procurement'
  }
];

// Admin override list - usernames that should always have admin access
const ADMIN_OVERRIDE_USERS = [
  'administrator', // Your username
  'admin'
  // Add more admin usernames as needed
];

// Check if a user should have admin override
function shouldOverrideToAdmin(username: string): boolean {
  return ADMIN_OVERRIDE_USERS.includes(username.toLowerCase());
}

// Check if central API is available
async function isCentralApiAvailable(): Promise<boolean> {
  try {
    // Check if the endpoint is reachable and responding properly
    // We just need to verify the API is responding, not that credentials work
    const response = await fetch(process.env.CENTRAL_API_URL || "http://10.116.3.138:8888/api/web_check_login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username: "test", 
        password: "test" 
      }),
      signal: AbortSignal.timeout(5000)
    })
    
    // Consider the API available if it responds (even with 401)
    // 401 means the API is reachable and working, just the credentials are wrong
    // Only return false if there's a connection error or server error (5xx)
    return response.status !== 500 && response.status !== 502 && response.status !== 503 && response.status !== 504
  } catch {
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
function validateTestCredentials(username: string, password: string): typeof TEST_ACCOUNTS[0] | null {
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
          // First, check if this is the admin fallback account
          const isAdmin = await validateAdminCredentials(
            credentials.username as string, 
            credentials.password as string
          )
          
          if (isAdmin) {
            // Create a virtual admin user for emergency access
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
              department: virtualAdminUser.department || 'LEGAL',
              centralDepartment: virtualAdminUser.department || 'LEGAL',
              departmentName: virtualAdminUser.departmentName || 'Legal Department',
              role: virtualAdminUser.role || 'GENERAL DIRECTOR',
              position: virtualAdminUser.departmentName || 'Legal Department',
              isFallbackAuth: true, // Flag to indicate fallback authentication
            }
          }
          
          // Check if central API is available
          const centralApiAvailable = await isCentralApiAvailable()
          
          // If central API is completely down, allow test accounts for emergency access
          if (!centralApiAvailable) {
              
              // Check for test accounts (only when central API is completely down)
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
              
              throw new Error('Central authentication service is completely unavailable. Only admin and test accounts can access the system for emergency purposes.')
            }

          // Central API is available - ALL authentication must go through it
          const user = await authenticateUser(
            credentials.username as string, 
            credentials.password as string
          )

          if (user) {
            // Central API authentication successful
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
          }
          
          // Central API authentication failed - no fallback to test accounts
          // Test accounts are only for admin/development purposes when central API is down
          throw new Error('Invalid credentials. Please use your central system credentials.')


        } catch (error) {
          // Central API authentication failed
          // Only allow admin fallback when central API is completely unavailable
          // Test accounts are not accessible when central API is working
          
          // Check if this is an admin user for emergency fallback
          const isAdmin = await validateAdminCredentials(
            credentials.username as string, 
            credentials.password as string
          )
          
          if (isAdmin) {
            // Create a virtual admin user for emergency access
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
          
          // No test account access when central API is working
          throw new Error('Authentication failed. Please use your central system credentials.')
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
      // Allow direct navigation to admin routes
      if (url.includes('/lvm/admin')) {
        return url
      }
      // After successful sign in, redirect to root (department routing handled in main page)
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/`
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