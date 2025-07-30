import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';

export async function GET(request: NextRequest) {
  try {
    const jdeService = createJDEService();
    
    // Test basic connection
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

    // Test Item Master query
    let itemMasterResult = null;
    try {
      const items = await jdeService.getItemMaster();
      itemMasterResult = {
        success: true,
        count: items.length,
        sample: items.slice(0, 2) // Show first 2 items
      };
    } catch (error) {
      itemMasterResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test Purchase Orders query
    let poResult = null;
    try {
      const pos = await jdeService.getPurchaseOrders();
      poResult = {
        success: true,
        count: pos.length,
        sample: pos.slice(0, 2) // Show first 2 POs
      };
    } catch (error) {
      poResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    await jdeService.disconnect();

    return NextResponse.json({
      success: true,
      data: {
        connection: 'success',
        timestamp: new Date().toISOString(),
        tests: {
          connection: { success: true },
          itemMaster: itemMasterResult,
          purchaseOrders: poResult
        }
      }
    });
  } catch (error) {
    console.error('JDE OracleDB test error:', error);
    
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