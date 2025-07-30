import { NextRequest, NextResponse } from 'next/server';
import { VNPTInvoiceApiResponse } from '@/types/invoice';

// API endpoint for checking VNPT invoices
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

export async function POST(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ 
      success: false, 
      message: 'Method not allowed' 
    }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { pattern, fkeys, account, acpass, username, password } = body;

    // Validate required fields
    if (!pattern || !fkeys) {
      return NextResponse.json({
        success: false,
        message: 'Pattern and fkeys are required'
      }, { status: 400 });
    }

    // Check if using environment variables or full credentials
    const isUsingEnvVars = !account && !acpass && !username && !password;
    
    if (isUsingEnvVars) {
      // Use environment variables for all credentials
      const client = await getVNPTClient();
      
      if (!client.isConfigured()) {
        return NextResponse.json({
          success: false,
          message: 'Environment variables not configured. Please provide full credentials.'
        }, { status: 400 });
      }

      const envCreds = client.getDefaultCredentials();
      
      // Call SOAP method with environment credentials
      const result = await client.getMCCQThueByFkeys({
        account: envCreds.account!,
        acpass: envCreds.acpass!,
        username: envCreds.username!,
        password: envCreds.password!,
        pattern,
        fkeys
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          data: result.data,
          metadata: {
            timestamp: new Date().toISOString(),
            pattern,
            fkeys,
            source: 'environment_variables'
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          message: result.error,
          faultCode: result.faultCode,
          details: process.env.NODE_ENV === 'development' ? result.rawError : undefined
        }, { status: 400 });
      }
    } else {
      // Use provided credentials (all fields provided by user)
      const requiredFields = ['account', 'acpass', 'username', 'password'];
      const missingFields = requiredFields.filter(field => !body[field]);

      if (missingFields.length > 0) {
        return NextResponse.json({
          success: false,
          message: 'Missing required fields',
          missingFields
        }, { status: 400 });
      }

      const client = await getVNPTClient();
      const result = await client.getMCCQThueByFkeys({
        account,
        acpass,
        username,
        password,
        pattern,
        fkeys
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          data: result.data,
          metadata: {
            timestamp: new Date().toISOString(),
            pattern,
            fkeys,
            source: 'provided_credentials'
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          message: result.error,
          faultCode: result.faultCode,
          details: process.env.NODE_ENV === 'development' ? result.rawError : undefined
        }, { status: 400 });
      }
    }

  } catch (error: any) {
    console.error('Invoice check API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    }, { status: 500 });
  }
} 