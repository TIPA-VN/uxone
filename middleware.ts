import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { mapRoleToConfigKey } from '@/config/app'
import { getUserAppropriateHomePage } from '@/lib/department-utils'
import { RequestContextManager } from './lib/logging/request-context';

export async function middleware(request: NextRequest) {
  // Extract user information from the request for logging context
  const userId = request.headers.get('x-user-id') || 'anonymous';
  const userName = request.headers.get('x-user-name') || 'Anonymous User';
  const userRole = request.headers.get('x-user-role') || 'guest';
  const userDepartment = request.headers.get('x-user-department') || 'unknown';
  const sessionId = request.headers.get('x-session-id') || `sess_${Date.now()}`;
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Set the request context for this request
  RequestContextManager.setContext({
    userId,
    userName,
    userRole,
    userDepartment,
    sessionId,
    ipAddress,
    userAgent,
    requestId,
    timestamp: new Date()
  });

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

    // Add CORS headers only to API routes, not to page routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
      return response;
    }
    
    // For non-API routes, just continue without adding CORS headers
    return NextResponse.next();
  }

  // Protect all routes under /lvm
  if (request.nextUrl.pathname.startsWith('/lvm')) {
    const session = await auth()

    if (!session?.user) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }

    // Update request context with actual user information from session
    if (session.user) {
      RequestContextManager.setContext({
        userId: session.user.id || 'unknown',
        userName: session.user.name || session.user.username || 'Unknown User',
        userRole: session.user.role || 'unknown',
        userDepartment: session.user.department || session.user.centralDepartment || 'unknown',
        sessionId: sessionId,
        ipAddress,
        userAgent,
        requestId,
        timestamp: new Date()
      });
    }

    // Check procurement access for procurement routes
    if (request.nextUrl.pathname.startsWith('/lvm/procurement')) {
      const userDepartment = session.user.department || session.user.centralDepartment;
      const userRole = session.user.role;
      
              // Only allow access if user is from LVM-PUR department or is ADMIN
      if (userDepartment !== 'LVM-PUR' && userRole !== 'ADMIN') {
        // Redirect to user's appropriate home page based on their department
        const userHomePage = getUserAppropriateHomePage(userDepartment || 'DEFAULT', userRole || 'STAFF');
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

    // Update request context with actual user information from session
    if (session.user) {
      RequestContextManager.setContext({
        userId: session.user.id || 'unknown',
        userName: session.user.name || session.user.username || 'Unknown User',
        userRole: session.user.role || 'unknown',
        userDepartment: session.user.department || session.user.centralDepartment || 'unknown',
        sessionId: sessionId,
        ipAddress,
        userAgent,
        requestId,
        timestamp: new Date()
      });
    }

    // Check if user has admin access based on role and department
    const userRole = session.user.role;
    const userDepartment = session.user.department || session.user.centralDepartment;
    
    // Map the user role to the config key format (handles spaces vs underscores)
    const mappedRole = mapRoleToConfigKey(userRole);
    
    // Define admin roles and departments
    const adminRoles = ['ADMIN', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'SENIOR_MANAGER'];
    const adminDepartments = ['IS', 'ADMIN', 'IT'];
    
    // Check if user has admin access
    const hasAdminRole = adminRoles.includes(mappedRole);
    const hasAdminDepartment = adminDepartments.includes(userDepartment);
    
    // Allow access if user has admin role OR is from admin department
    if (!hasAdminRole && !hasAdminDepartment) {
      // Redirect to user's appropriate home page if no admin access
      const userHomePage = getUserAppropriateHomePage(userDepartment || 'DEFAULT', userRole || 'STAFF');
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
