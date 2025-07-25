import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Protect all routes under /lvm
  if (request.nextUrl.pathname.startsWith('/lvm')) {
    const session = await auth()
    console.log('Middleware check:', { 
      path: request.nextUrl.pathname,
      hasSession: !!session,
      sessionUser: session?.user 
    })

    if (!session?.user) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
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
