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
        error: 'Failed to connect to JDE database',
        data: {
          connection: 'failed',
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }

    // Get connection to run diagnostic queries
    const connection = await (jdeService as any).getConnection();
    
    // Check what columns exist in F4101
    let f4101Columns = [];
    try {
      const result = await connection.execute(
        `SELECT column_name, data_type, data_length 
         FROM user_tab_columns 
         WHERE table_name = 'F4101' 
         ORDER BY column_id`,
        [],
        { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
      );
      f4101Columns = result.rows || [];
    } catch (error) {
      f4101Columns = [{ error: error instanceof Error ? error.message : 'Unknown error' }];
    }

    // Check what columns exist in F4301
    let f4301Columns = [];
    try {
      const result = await connection.execute(
        `SELECT column_name, data_type, data_length 
         FROM user_tab_columns 
         WHERE table_name = 'F4301' 
         ORDER BY column_id`,
        [],
        { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
      );
      f4301Columns = result.rows || [];
    } catch (error) {
      f4301Columns = [{ error: error instanceof Error ? error.message : 'Unknown error' }];
    }

    // Check what columns exist in F4311
    let f4311Columns = [];
    try {
      const result = await connection.execute(
        `SELECT column_name, data_type, data_length 
         FROM user_tab_columns 
         WHERE table_name = 'F4311' 
         ORDER BY column_id`,
        [],
        { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
      );
      f4311Columns = result.rows || [];
    } catch (error) {
      f4311Columns = [{ error: error instanceof Error ? error.message : 'Unknown error' }];
    }

    // Try to get a sample row from each table
    let f4101Sample = null;
    try {
      const result = await connection.execute(
        'SELECT * FROM F4101 WHERE ROWNUM = 1',
        [],
        { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
      );
      f4101Sample = result.rows && result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      f4101Sample = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    let f4301Sample = null;
    try {
      const result = await connection.execute(
        'SELECT * FROM F4301 WHERE ROWNUM = 1',
        [],
        { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
      );
      f4301Sample = result.rows && result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      f4301Sample = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    await jdeService.disconnect();

    return NextResponse.json({
      success: true,
      data: {
        connection: 'success',
        timestamp: new Date().toISOString(),
        tables: {
          F4101: {
            columns: f4101Columns,
            sample: f4101Sample
          },
          F4301: {
            columns: f4301Columns,
            sample: f4301Sample
          },
          F4311: {
            columns: f4311Columns
          }
        }
      }
    });
  } catch (error) {
    console.error('JDE Diagnostic error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        connection: 'error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 