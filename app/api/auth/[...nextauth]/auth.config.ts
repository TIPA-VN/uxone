import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const runtime = 'nodejs'

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
          console.log('Auth attempt:', { username: credentials.username })
          
          // Call central authentication API
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
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
          console.log('Auth API response:', { status: response.status, data })

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

          // Upsert the user in the local DB with the latest info from the central API
          await prisma.user.upsert({
            where: { username: data.emp_code },
            update: {
              name: data.emp_name || data.emp_code,
              email: data.email || `${data.emp_code}@tipa.co.th`,
              department: data.emp_dept || 'UNKNOWN',
              departmentName: data.emp_dept_name || 'Unknown Department',
              role: data.emp_pos, // use role only
            },
            create: {
              username: data.emp_code,
              name: data.emp_name || data.emp_code,
              email: data.email || `${data.emp_code}@tipa.co.th`,
              department: data.emp_dept || 'UNKNOWN',
              departmentName: data.emp_dept_name || 'Unknown Department',
              role: data.emp_pos, // use role only
              hashedPassword: '',
            },
          });

          // Now fetch the user from the local DB
          const dbUser = await prisma.user.findUnique({ where: { username: data.emp_code } });
          if (!dbUser) throw new Error('User not found in local DB');

          const user = {
            id: dbUser.id, // Use the local DB user ID!
            name: dbUser.name,
            email: dbUser.email,
            username: dbUser.username,
            department: dbUser.department,
            departmentName: dbUser.departmentName,
            role: dbUser.role,
          }
          console.log('Auth success:', user)
          return user
        } catch (error) {
          console.error('Auth error:', error)
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.department = user.department
        token.departmentName = user.departmentName
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
          departmentName: token.departmentName as string,
        }
      }
      return session
    },
  },
} as const satisfies NextAuthConfig 