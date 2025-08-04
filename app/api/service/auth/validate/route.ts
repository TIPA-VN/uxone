import { NextRequest, NextResponse } from 'next/server';
import { validateServiceToken, hasPermission } from '../../middleware';

export const runtime = 'nodejs';

// POST /api/service/auth/validate - Validate service token
export async function POST(request: NextRequest) {
  try {
    const authContext = await validateServiceToken(request);
    
    if (!authContext) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requiredPermission } = body;

    // If a specific permission is requested, check it
    if (requiredPermission) {
      const hasRequiredPermission = hasPermission(authContext.permissions, requiredPermission);
      
      return NextResponse.json({
        valid: true,
        service: {
          id: authContext.serviceId,
          name: authContext.serviceName,
          permissions: authContext.permissions,
          rateLimit: authContext.rateLimit,
        },
        hasPermission: hasRequiredPermission,
        requiredPermission,
      });
    }

    // Return general validation info
    return NextResponse.json({
      valid: true,
      service: {
        id: authContext.serviceId,
        name: authContext.serviceName,
        permissions: authContext.permissions,
        rateLimit: authContext.rateLimit,
      },
    });

  } catch (error) {
    console.error('Error validating service token:', error);
    return NextResponse.json(
      { error: "Token validation failed" },
      { status: 500 }
    );
  }
}

// GET /api/service/auth/validate - Get current service info
export async function GET(request: NextRequest) {
  try {
    const authContext = await validateServiceToken(request);
    
    if (!authContext) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      service: {
        id: authContext.serviceId,
        name: authContext.serviceName,
        permissions: authContext.permissions,
        rateLimit: authContext.rateLimit,
      },
    });

  } catch (error) {
    console.error('Error getting service info:', error);
    return NextResponse.json(
      { error: "Failed to get service info" },
      { status: 500 }
    );
  }
} 