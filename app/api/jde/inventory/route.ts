import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemNumber = searchParams.get('itemNumber');
    const branch = searchParams.get('branch');
    
    const jdeService = createJDEService();
    
    // Get Item Master data
    const itemMaster = await jdeService.getItemMaster(itemNumber || undefined);
    
    // Get Item Location data
    const itemLocation = await jdeService.getItemLocation(itemNumber || undefined, branch || undefined);
    
    await jdeService.disconnect();

    return NextResponse.json({
      success: true,
      data: {
        itemMaster,
        itemLocation,
        summary: {
          totalItems: itemMaster.length,
          totalLocations: itemLocation.length,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('JDE Inventory fetch error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        itemMaster: [],
        itemLocation: [],
        summary: {
          totalItems: 0,
          totalLocations: 0,
          timestamp: new Date().toISOString()
        }
      }
    }, { status: 500 });
  }
} 