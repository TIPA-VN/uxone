import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';

export async function GET(request: NextRequest) {
  try {
    const jdeService = createJDEService();
    
    // Test basic connection first
    const isConnected = await jdeService.testConnection();
    
    if (!isConnected) {
      await jdeService.disconnect();
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to JDE database'
      }, { status: 500 });
    }

    // Get connection to run test query
    const connection = await (jdeService as any).getConnection();
    
    // Try to get a sample row from F4301
    let result = null;
    try {
      const queryResult = await connection.execute(
        'SELECT * FROM F4301 WHERE ROWNUM = 1',
        [],
        { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
      );
      result = {
        success: true,
        rowCount: queryResult.rows?.length || 0,
        sample: queryResult.rows && queryResult.rows.length > 0 ? queryResult.rows[0] : null
      };
    } catch (error) {
      result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    await jdeService.disconnect();

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('F4301 test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 