import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserHomePage, mapRoleToConfigKey } from '@/config/app'

export async function middleware(request: NextRequest) {
  // Handle CORS for service API routes and integration routes
  if (request.nextUrl.pathname.startsWith('/api/service/') || request.nextUrl.pathname.startsWith('/api/integration/')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      });
    }

    // Add CORS headers to all service API responses
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    return response;
  }

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

  // Protect all routes under /lvm/admin
  if (request.nextUrl.pathname.startsWith('/lvm/admin')) {
    const session = await auth()

    if (!session?.user) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }

    // Check if user has admin access based on role and department
    const userRole = session.user.role;
    const userDepartment = session.user.department || session.user.centralDepartment;
    
    console.log('Middleware - Admin check:', { userRole, userDepartment });
    
    // Map the user role to the config key format (handles spaces vs underscores)
    const mappedRole = mapRoleToConfigKey(userRole);
    console.log('Middleware - Mapped role:', mappedRole);
    
    // Define admin roles and departments
    const adminRoles = ['ADMIN', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'SENIOR_MANAGER'];
    const adminDepartments = ['IS', 'ADMIN', 'IT'];
    
    // Check if user has admin access
    const hasAdminRole = adminRoles.includes(mappedRole);
    const hasAdminDepartment = adminDepartments.includes(userDepartment);
    
    console.log('Middleware - Admin access check:', { hasAdminRole, hasAdminDepartment });
    
    // Allow access if user has admin role OR is from admin department
    if (!hasAdminRole && !hasAdminDepartment) {
      console.log('Middleware - Access denied, redirecting to:', getUserHomePage(userDepartment || 'DEFAULT'));
      // Redirect to user's appropriate home page if no admin access
      const userHomePage = getUserHomePage(userDepartment || 'DEFAULT');
      return NextResponse.redirect(new URL(userHomePage, request.url))
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
