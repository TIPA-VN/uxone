import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';
import oracledb from 'oracledb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const poNumber = searchParams.get('poNumber') || '992';

    const jdeService = createJDEService();

    // Test connection first
    const isConnected = await jdeService.testConnection();
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'JDE connection failed'
      });
    }

    const connection = await jdeService.getConnection();

    // Try different column combinations for F4311
    const testQueries = [
      {
        name: 'Basic PDDOCO query',
        query: 'SELECT PDDOCO FROM F4311 WHERE PDDOCO = :poNumber AND ROWNUM <= 3',
        params: [poNumber]
      },
      {
        name: 'Common columns query',
        query: 'SELECT PDDOCO, PDLINE, PDITM FROM F4311 WHERE PDDOCO = :poNumber AND ROWNUM <= 3',
        params: [poNumber]
      },
      {
        name: 'All columns query',
        query: 'SELECT * FROM F4311 WHERE PDDOCO = :poNumber AND ROWNUM <= 1',
        params: [poNumber]
      }
    ];

    const results = [];

    for (const testQuery of testQueries) {
      try {
        const result = await connection.execute(testQuery.query, testQuery.params, {
          outFormat: oracledb.OUT_FORMAT_OBJECT
        });
        
        results.push({
          name: testQuery.name,
          success: true,
          rowCount: result.rows?.length || 0,
          sampleData: result.rows?.[0] || null
        });
      } catch (error) {
        results.push({
          name: testQuery.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    await jdeService.disconnect();

    return NextResponse.json({
      success: true,
      data: {
        poNumber,
        testResults: results
      }
    });

  } catch (error) {
    console.error('Error testing F4311:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to test F4311 table',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 