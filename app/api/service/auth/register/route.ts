import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import crypto from 'crypto';

export const runtime = 'nodejs';

// POST /api/service/auth/register - Register a new service app
export async function POST(request: NextRequest) {
  try {
    // Only allow system administrators to register service apps
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin privileges
    const isAdmin = session.user.role === 'SYSTEM_ADMINISTRATOR' || 
                   session.user.role === 'GENERAL_DIRECTOR';
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { name, permissions = [], rateLimit = 100 } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    // Validate permissions
    const validPermissions = [
      'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
      'notifications:read', 'notifications:create', 'notifications:broadcast',
      'approvals:read', 'approvals:create', 'approvals:approve', 'approvals:reject',
      '*' // Wildcard for all permissions
    ];

    const invalidPermissions = permissions.filter((p: string) => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { error: `Invalid permissions: ${invalidPermissions.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate unique service key
    const serviceKey = crypto.randomBytes(32).toString('hex');

    // Create service app
    const serviceApp = await prisma.serviceApp.create({
      data: {
        name,
        serviceKey,
        permissions,
        rateLimit,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: serviceApp.id,
      name: serviceApp.name,
      serviceKey: serviceApp.serviceKey, // Only returned during creation
      permissions: serviceApp.permissions,
      rateLimit: serviceApp.rateLimit,
      isActive: serviceApp.isActive,
      createdAt: serviceApp.createdAt,
      message: 'Service app registered successfully. Please save the service key securely.',
    }, { status: 201 });

  } catch (error) {
    console.error('Error registering service app:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "Service name already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to register service app" },
      { status: 500 }
    );
  }
}

// GET /api/service/auth/register - List registered service apps (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin privileges
    const isAdmin = session.user.role === 'SYSTEM_ADMINISTRATOR' || 
                   session.user.role === 'GENERAL_DIRECTOR';
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const serviceApps = await prisma.serviceApp.findMany({
      select: {
        id: true,
        name: true,
        permissions: true,
        rateLimit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true,
            notifications: true,
            approvals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(serviceApps);

  } catch (error) {
    console.error('Error fetching service apps:', error);
    return NextResponse.json(
      { error: "Failed to fetch service apps" },
      { status: 500 }
    );
  }
} 