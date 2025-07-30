import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';
import oracledb from 'oracledb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const poNumber = searchParams.get('poNumber') || '992'; // Use a sample PO number

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

    // Get column information for F4311
    const columnsQuery = `
      SELECT column_name, data_type, data_length, nullable
      FROM user_tab_columns 
      WHERE table_name = 'F4311'
      ORDER BY column_id
    `;

    const columnsResult = await connection.execute(columnsQuery, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    // Get sample data from F4311 for the specific PO
    const sampleQuery = `
      SELECT * FROM F4311 
      WHERE PDDOCO = :poNumber 
      AND ROWNUM <= 5
    `;

    const sampleResult = await connection.execute(sampleQuery, [poNumber], {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    // Get count of lines for this PO
    const countQuery = `
      SELECT COUNT(*) as line_count
      FROM F4311 
      WHERE PDDOCO = :poNumber
    `;

    const countResult = await connection.execute(countQuery, [poNumber], {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    await jdeService.disconnect();

    return NextResponse.json({
      success: true,
      data: {
        poNumber,
        columns: columnsResult.rows || [],
        sampleData: sampleResult.rows || [],
        lineCount: countResult.rows?.[0]?.LINE_COUNT || 0,
        summary: {
          totalColumns: columnsResult.rows?.length || 0,
          totalSampleRows: sampleResult.rows?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('Error in F4311 diagnosis:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to diagnose F4311 table',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 