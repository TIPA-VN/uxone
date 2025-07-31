import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';

// In-memory cache for inventory data
let inventoryCache: any[] = [];
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached data or fetch fresh data
async function getCachedInventoryData() {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (inventoryCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log(`[Cached Inventory] Returning ${inventoryCache.length} cached items`);
    return inventoryCache;
  }
  
  console.log('[Cached Inventory] Cache expired or empty, fetching fresh data...');
  
  try {
    const jdeService = createJDEService();
    
    // Test connection first
    const isConnected = await jdeService.testConnection();
    if (!isConnected) {
      throw new Error('JDE connection failed');
    }
    
    // Fetch all inventory data (no pagination)
    const allInventory = await jdeService.getAllInventoryItems();
    
    // Update cache
    inventoryCache = allInventory;
    cacheTimestamp = now;
    
    await jdeService.disconnect();
    
    console.log(`[Cached Inventory] Cached ${inventoryCache.length} items`);
    return inventoryCache;
  } catch (error) {
    console.error('[Cached Inventory] Error fetching data:', error);
    throw error;
  }
}

// Helper function to apply filters
function applyFilters(items: any[], filters: {
  search?: string;
  status?: string;
  businessUnit?: string;
  glClass?: string;
}) {
  let filteredItems = [...items];
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      item.IMITM.toLowerCase().includes(searchLower) ||
      item.IMLITM.toLowerCase().includes(searchLower) ||
      item.IMBUY.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters.status && filters.status !== 'all') {
    filteredItems = filteredItems.filter(item => item.StockStatus === filters.status);
  }
  
  if (filters.businessUnit && filters.businessUnit !== 'all') {
    filteredItems = filteredItems.filter(item => item.LIMCU?.trim() === filters.businessUnit);
  }
  
  if (filters.glClass && filters.glClass !== 'all') {
    filteredItems = filteredItems.filter(item => item.IMGLPT?.trim() === filters.glClass);
  }
  
  return filteredItems;
}

// Helper function to apply pagination
function applyPagination(items: any[], page: number, pageSize: number) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return items.slice(startIndex, endIndex);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const businessUnit = searchParams.get('businessUnit');
    const glClass = searchParams.get('glClass');
    
    console.log(`[Cached Inventory] Request: page=${page}, pageSize=${pageSize}, glClass=${glClass}`);
    
    // Get cached data
    const allInventory = await getCachedInventoryData();
    
    // Apply filters
    const filters = { search, status, businessUnit, glClass };
    const filteredItems = applyFilters(allInventory, filters);
    
    console.log(`[Cached Inventory] After filtering: ${filteredItems.length} items`);
    
    // Apply pagination
    const paginatedItems = applyPagination(filteredItems, page, pageSize);
    
    console.log(`[Cached Inventory] After pagination: ${paginatedItems.length} items`);
    
    // Calculate summary statistics
    const summary = {
      totalItems: filteredItems.length,
      inStock: filteredItems.filter(item => item.StockStatus === 'OK').length,
      lowStock: filteredItems.filter(item => item.StockStatus === 'LOW').length,
      outOfStock: filteredItems.filter(item => item.StockStatus === 'OUT').length,
      totalValue: filteredItems.reduce((sum, item) => sum + (item.AvailableStock * (item.IMSSQ || 1)), 0),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        inventoryLevels: paginatedItems,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalItems: filteredItems.length,
          totalPages: Math.ceil(filteredItems.length / pageSize)
        },
        summary,
        cacheInfo: {
          cachedAt: new Date(cacheTimestamp).toISOString(),
          cacheAge: Date.now() - cacheTimestamp,
          totalCachedItems: inventoryCache.length
        }
      }
    });
  } catch (error) {
    console.error('[Cached Inventory] Error:', error);
    
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

// Endpoint to clear cache
export async function DELETE() {
  inventoryCache = [];
  cacheTimestamp = 0;
  
  return NextResponse.json({
    success: true,
    message: 'Cache cleared successfully'
  });
} 