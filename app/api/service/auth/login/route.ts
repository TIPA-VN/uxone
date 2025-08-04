import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// POST /api/service/auth/login - Service app authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceKey } = body;

    if (!serviceKey) {
      return NextResponse.json(
        { error: "Service key is required" },
        { status: 400 }
      );
    }

    // Find service app by key
    const serviceApp = await prisma.serviceApp.findFirst({
      where: { serviceKey, isActive: true },
    });

    if (!serviceApp) {
      return NextResponse.json(
        { error: "Invalid service key or service is inactive" },
        { status: 401 }
      );
    }

    // Return service key as token (no JWT needed)
    const token = serviceApp.serviceKey;

    // Update last login time (optional - add to schema if needed)
    await prisma.serviceApp.update({
      where: { id: serviceApp.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      token,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      service: {
        id: serviceApp.id,
        name: serviceApp.name,
        permissions: serviceApp.permissions,
        rateLimit: serviceApp.rateLimit,
      },
    });

  } catch (error) {
    console.error('Error authenticating service app:', error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
} 