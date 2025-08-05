import { NextRequest, NextResponse } from 'next/server';
import { withCORS } from '@/lib/cors';

export const GET = withCORS(async (request: NextRequest) => {
  return NextResponse.json({
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    origin: request.headers.get('origin'),
  });
}); 