import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserHomePage } from '@/config/app'

export async function middleware(request: NextRequest) {
  // Protect all routes under /lvm
  if (request.nextUrl.pathname.startsWith('/lvm')) {
    const session = await auth()

    if (!session?.user) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }

    // Check procurement access for procurement routes
    if (request.nextUrl.pathname.startsWith('/lvm/procurement')) {
      const userDepartment = session.user.department || session.user.centralDepartment;
      const userRole = session.user.role;
      
      // Only allow access if user is from PROC department or is ADMIN
      if (userDepartment !== 'PROC' && userRole !== 'ADMIN') {
        // Redirect to user's appropriate home page based on their department
        const userHomePage = getUserHomePage(userDepartment || 'DEFAULT');
        return NextResponse.redirect(new URL(userHomePage, request.url))
      }
    }
  }

  return NextResponse.next()
}

// Prevent infinite redirects by excluding auth routes
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public|auth/signin|auth/error).*)',
  ],
}
