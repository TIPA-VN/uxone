import { NextRequest, NextResponse } from 'next/server';
import { ContractExpirationService } from '@/lib/contract-expiration-service';

// This endpoint can be called by cron jobs or scheduled tasks
export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (you may want to add API key authentication)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action = 'check-expirations' } = body;

    let result: any = {};

    switch (action) {
      case 'check-expirations':
        result = await ContractExpirationService.checkExpiringContracts();
        break;
        
      case 'process-renewals':
        result = await ContractExpirationService.processAutoRenewals();
        break;
        
      case 'full-monitoring':
        // Run both expiration checks and auto-renewals
        const expirationResult = await ContractExpirationService.checkExpiringContracts();
        const renewalResult = await ContractExpirationService.processAutoRenewals();
        
        result = {
          expiration: expirationResult,
          renewal: renewalResult,
          summary: {
            totalContractsChecked: expirationResult.contractsChecked,
            totalNotificationsSent: expirationResult.notificationsSent,
            totalContractsRenewed: renewalResult.renewed,
            totalErrors: expirationResult.errors.length + renewalResult.errors.length
          }
        };
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log the results for monitoring
    console.log(`[Contract Monitoring] ${action} completed:`, result);

    return NextResponse.json({
      success: true,
      action,
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    console.error('Error in automated contract monitoring:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual monitoring dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');

    const summary = await ContractExpirationService.getExpirationSummary(days);

    return NextResponse.json({
      success: true,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching monitoring summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring summary' },
      { status: 500 }
    );
  }
}
