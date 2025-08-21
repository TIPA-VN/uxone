import { NextRequest, NextResponse } from 'next/server';
import { SOAPMethodsResponse } from '@/types/invoice';

// Use the HTTP-based SOAP client instead of the problematic soap package
let vnptClient: any = null;

async function getVNPTClient() {
  if (!vnptClient) {
    try {
      const { default: client } = await import('@/lib/vnpt-invoice-client-http');
      vnptClient = client;
    } catch (error) {
      // Handle VNPT client error silently
      return NextResponse.json({ error: 'Failed to load VNPT client' }, { status: 500 });
    }
  }
  return vnptClient;
}

export async function GET(request: NextRequest): Promise<NextResponse<SOAPMethodsResponse>> {
  if (request.method !== 'GET') {
    return NextResponse.json({ 
      success: false, 
      message: 'Method not allowed' 
    }, { status: 405 });
  }

  try {
    const client = await getVNPTClient();
    const methods = await client.describeMethods();
    
    return NextResponse.json({
      success: true,
      data: methods
    });
  } catch (error: any) {
    // Handle SOAP methods error silently
    return NextResponse.json({ error: 'SOAP methods check failed' }, { status: 500 });
  }
} 