import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define protected paths and required roles
const roleBasedRoutes: Record<string, string[]> = {
  "/admin": ["admin"],
  "/lvm": ["admin", "manager"],
  "/dashboard": ["admin", "manager"],
}; 

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  const { pathname } = req.nextUrl;

  // Public route — allow
  if (pathname.startsWith("/auth") || pathname === "/") {
    return NextResponse.next();
  }

  // Not logged in — redirect to login
  if (!token) {
    const loginUrl = new URL("/auth/signin", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based protection
  for (const path in roleBasedRoutes) {
    if (pathname.startsWith(path)) {
      const allowedRoles = roleBasedRoutes[path];
      const userRole = token.role as string | undefined;

      if (!allowedRoles.includes(userRole || "")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/lvm/:path*", "/dashboard/:path*", "/auth/:path*", "/"], // customize your protected routes
};
