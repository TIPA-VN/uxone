import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Service app authentication middleware
export interface ServiceAuthContext {
  serviceId: string;
  serviceName: string;
  permissions: string[];
  rateLimit: number;
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Service authentication cache (5 minute TTL)
const authCache = new Map<string, { context: ServiceAuthContext; expires: number }>();
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Service token validation with caching
export async function validateServiceToken(request: NextRequest): Promise<ServiceAuthContext | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const serviceKey = authHeader.substring(7);
    
    // Check cache first
    const cached = authCache.get(serviceKey);
    if (cached && cached.expires > Date.now()) {
      return cached.context;
    }

    // Find service by service key
    const service = await prisma.serviceApp.findFirst({
      where: { serviceKey, isActive: true },
    });

    if (!service) {
      return null;
    }

    const context: ServiceAuthContext = {
      serviceId: service.id,
      serviceName: service.name,
      permissions: service.permissions,
      rateLimit: service.rateLimit,
    };

    // Cache the result
    authCache.set(serviceKey, {
      context,
      expires: Date.now() + AUTH_CACHE_TTL
    });

    return context;
  } catch (error) {
    console.error('Service token validation error:', error);
    return null;
  }
}

// Rate limiting middleware
export function checkRateLimit(serviceId: string, rateLimit: number): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const key = `${serviceId}:${Math.floor(now / windowMs)}`;

  const current = rateLimitStore.get(key);
  if (!current || current.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= rateLimit) {
    return false;
  }

  current.count++;
  return true;
}

// Main service middleware
export async function serviceMiddleware(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Skip service authentication for OPTIONS requests (CORS preflight)
    if (request.method === 'OPTIONS') {
      return null; // Allow the request to continue without authentication
    }

    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json(
        { error: 'Invalid or missing service token' },
        { status: 401 }
      );
    }

    // Check rate limiting
    if (!checkRateLimit(authContext.serviceId, authContext.rateLimit)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Add auth context to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-service-id', authContext.serviceId);
    requestHeaders.set('x-service-name', authContext.serviceName);
    requestHeaders.set('x-service-permissions', JSON.stringify(authContext.permissions));

    // Create new request with updated headers
    const newRequest = new NextRequest(request, {
      headers: requestHeaders,
    });

    // Continue with the request
    return null;
  } catch (error) {
    console.error('Service middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Permission checking helper
export function hasPermission(permissions: string[], requiredPermission: string): boolean {
  return permissions.includes(requiredPermission) || permissions.includes('*');
}

// Enhanced service request logging with performance metrics
export function logServiceRequest(
  serviceId: string,
  method: string,
  path: string,
  statusCode: number,
  responseTime: number,
  details?: { userAgent?: string; ip?: string; error?: string }
) {
  const timestamp = new Date().toISOString();
  const logLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
  
  console.log(
    `[${logLevel}][SERVICE] ${timestamp} | ${serviceId} | ${method} ${path} | ${statusCode} | ${responseTime}ms${
      details?.error ? ` | Error: ${details.error}` : ''
    }${details?.ip ? ` | IP: ${details.ip}` : ''}`
  );

  // Performance monitoring
  if (responseTime > 1000) {
    console.warn(`[PERFORMANCE] Slow service request: ${serviceId} ${method} ${path} took ${responseTime}ms`);
  }
} 