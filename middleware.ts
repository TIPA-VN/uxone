import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

// Routes that require specific permissions
const PROTECTED_ROUTES = {
  "/admin/users": ["manage_users"],
  "/lvm": ["view_lvm"],
  "/lvm/cs": ["view_cs"],
  "/lvm/purchasing": ["view_purchasing"],
  "/dashboard": ["view_dashboard"],
} as const;

// Helper function to handle CORS
function corsResponse(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,DELETE,PATCH,POST,PUT"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  return response;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isAuth = !!req.auth;

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return corsResponse(new NextResponse(null, { status: 200 }));
  }

  // Handle API routes
  if (nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    return corsResponse(response);
  }

  // Public routes
  if (
    nextUrl.pathname === "/auth/signin" ||
    nextUrl.pathname === "/auth/error" ||
    nextUrl.pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!isAuth) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // Check route permissions
  const userRole = req.auth?.user?.role;
  const userDepartment = req.auth?.user?.department;
  
  for (const [route, permissions] of Object.entries(PROTECTED_ROUTES)) {
    if (nextUrl.pathname.startsWith(route)) {
      const hasAccess = permissions.some((permission) =>
        hasPermission(userRole ?? "", permission, userDepartment)
      );

      if (!hasAccess) {
        return NextResponse.redirect(
          new URL("/auth/error?error=AccessDenied", nextUrl)
        );
      }
    }
  }

  return NextResponse.next();
})

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
