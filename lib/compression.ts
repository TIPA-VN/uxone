import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Compression utility for API responses
export function compressResponse(response: NextResponse, data: any): NextResponse {
  try {
    // Convert data to JSON string
    const jsonString = JSON.stringify(data);
    
    // Check if client accepts gzip compression
    const acceptEncoding = response.headers.get('accept-encoding') || '';
    const supportsGzip = acceptEncoding.includes('gzip');
    
    if (supportsGzip && jsonString.length > 1024) { // Only compress if > 1KB
      // For now, we'll rely on Next.js built-in compression
      // The compress: true in next.config.ts should handle this
      response.headers.set('Content-Encoding', 'gzip');
    }
    
    return response;
  } catch (error) {
    // Handle compression error silently
    return data;
  }
}

// Helper to set compression headers
export function setCompressionHeaders(response: NextResponse): NextResponse {
  response.headers.set('Vary', 'Accept-Encoding');
  return response;
}
