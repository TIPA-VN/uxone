import { NextRequest, NextResponse } from 'next/server';

// API endpoint to check VNPT configuration
let vnptClient: any = null;

async function getVNPTClient() {
  if (!vnptClient) {
    try {
      const { default: client } = await import('@/lib/vnpt-invoice-client-http');
      vnptClient = client;
    } catch (error) {
      console.error('Failed to load VNPT client:', error);
      throw new Error('VNPT client not available');
    }
  }
  return vnptClient;
}

export async function GET(request: NextRequest) {
  if (request.method !== 'GET') {
    return NextResponse.json({ 
      success: false, 
      message: 'Method not allowed' 
    }, { status: 405 });
  }

  try {
    const client = await getVNPTClient();
    const isConfigured = client.isConfigured();
    const defaults = client.getDefaultCredentials();

    return NextResponse.json({
      success: true,
      isConfigured,
      defaults: null, // No defaults to return since all credentials come from environment
      // Don't return sensitive data like passwords
      hasCredentials: !!(defaults.account && defaults.acpass && defaults.username && defaults.password)
    });
  } catch (error: any) {
    console.error('Configuration check error:', error);
    
    return NextResponse.json({
      success: false,
      isConfigured: false,
      message: error.message || 'Failed to check configuration'
    }, { status: 500 });
  }
} 