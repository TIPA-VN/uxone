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
    
    // Get real inventory levels with calculations
    const inventoryLevels = await jdeService.getInventoryLevels(itemNumber || undefined, page, pageSize);
    
    // Get total count for proper pagination
    const totalCount = await jdeService.getInventoryCount();
    
    // Apply search and status filters
    let filteredItems = inventoryLevels;
    
    if (search) {
      filteredItems = filteredItems.filter(item => 
        item.IMITM.toLowerCase().includes(search.toLowerCase()) ||
        item.IMLITM.toLowerCase().includes(search.toLowerCase()) ||
        item.IMBUY.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status && status !== 'all') {
      filteredItems = filteredItems.filter(item => item.StockStatus === status);
    }
    
    if (businessUnit && businessUnit !== 'all') {
      filteredItems = filteredItems.filter(item => item.LIMCU?.trim() === businessUnit);
    }
    
    if (glClass && glClass !== 'all') {
      filteredItems = filteredItems.filter(item => item.IMGLPT?.trim() === glClass);
    }
    
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