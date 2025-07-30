import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';

export async function GET(request: NextRequest) {
  try {
    const jdeService = createJDEService();
    
    // Test connection
    const isConnected = await jdeService.testConnection();
    
    // Get connection info (without sensitive data)
    const connectionInfo = {
      status: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      dbHost: process.env.JDE_DB_HOST || 'not configured',
      dbPort: process.env.JDE_DB_PORT || 'not configured',
      dbService: process.env.JDE_DB_SERVICE || 'not configured',
      aisServer: process.env.JDE_AIS_SERVER || 'not configured',
      aisPort: process.env.JDE_AIS_PORT || 'not configured'
    };

    await jdeService.disconnect();

    return NextResponse.json({
      success: true,
      data: connectionInfo
    });
  } catch (error) {
    console.error('JDE Connection test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const jdeService = createJDEService();
    
    // Test connection and sync
    const isConnected = await jdeService.testConnection();
    
    if (!isConnected) {
      await jdeService.disconnect();
      return NextResponse.json({
        success: false,
        error: 'JDE connection failed'
      }, { status: 500 });
    }

    // Sync data to local database
    const syncResult = await jdeService.syncToLocalDatabase();
    
    await jdeService.disconnect();

    return NextResponse.json({
      success: syncResult.success,
      message: syncResult.message,
      data: {
        timestamp: new Date().toISOString(),
        syncStatus: syncResult.success ? 'completed' : 'failed'
      }
    });
  } catch (error) {
    console.error('JDE Sync error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        timestamp: new Date().toISOString(),
        syncStatus: 'failed'
      }
    }, { status: 500 });
  }
} 