import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemNumber = searchParams.get('itemNumber');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const businessUnit = searchParams.get('businessUnit');
    const glClass = searchParams.get('glClass');
    
    const jdeService = createJDEService();
    
    // Test connection first
    const isConnected = await jdeService.testConnection();
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'JDE connection failed',
        data: null
      }, { status: 500 });
    }
    
    console.log(`[Inventory API] Fetching inventory for page ${page}, pageSize ${pageSize}, glClass: ${glClass}`);
    
    // Get real inventory levels with calculations
    const inventoryLevels = await jdeService.getInventoryLevels(itemNumber || undefined, page, pageSize, glClass || undefined);
    console.log(`[Inventory API] Retrieved ${inventoryLevels.length} inventory items`);
    
    // Get total count for proper pagination
    const totalCount = await jdeService.getInventoryCount();
    console.log(`[Inventory API] Total count: ${totalCount}`);
    
    // Apply search and status filters
    let filteredItems = inventoryLevels;
    console.log(`[Inventory API] Initial items: ${filteredItems.length}`);
    
    if (search) {
      filteredItems = filteredItems.filter(item => 
        item.IMITM.toLowerCase().includes(search.toLowerCase()) ||
        item.IMLITM.toLowerCase().includes(search.toLowerCase()) ||
        item.IMBUY.toLowerCase().includes(search.toLowerCase())
      );
      console.log(`[Inventory API] After search filter: ${filteredItems.length}`);
    }
    
    if (status && status !== 'all') {
      filteredItems = filteredItems.filter(item => item.StockStatus === status);
      console.log(`[Inventory API] After status filter: ${filteredItems.length}`);
    }
    
    if (businessUnit && businessUnit !== 'all') {
      filteredItems = filteredItems.filter(item => item.LIMCU?.trim() === businessUnit);
      console.log(`[Inventory API] After business unit filter: ${filteredItems.length}`);
    }
    
    // GL class filtering is now done at the database level in getInventoryLevels
    
    // Calculate summary statistics
    const summary = {
      totalItems: totalCount,
      inStock: filteredItems.filter(item => item.StockStatus === 'OK').length,
      lowStock: filteredItems.filter(item => item.StockStatus === 'LOW').length,
      outOfStock: filteredItems.filter(item => item.StockStatus === 'OUT').length,
      totalValue: filteredItems.reduce((sum, item) => sum + (item.AvailableStock * (item.IMSSQ || 1)), 0), // Rough estimate
      timestamp: new Date().toISOString()
    };
    
    await jdeService.disconnect();

    return NextResponse.json({
      success: true,
      data: {
        inventoryLevels: filteredItems,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        },
        summary
      }
    });
  } catch (error) {
    console.error('JDE Inventory fetch error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        inventoryLevels: [],
        pagination: {
          currentPage: 1,
          pageSize: 50,
          totalItems: 0,
          totalPages: 0
        },
        summary: {
          totalItems: 0,
          inStock: 0,
          lowStock: 0,
          outOfStock: 0,
          totalValue: 0,
          timestamp: new Date().toISOString()
        }
      }
    }, { status: 500 });
  }
} 