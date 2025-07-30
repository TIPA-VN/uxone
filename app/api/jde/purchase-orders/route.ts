import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const poNumber = searchParams.get('poNumber');
    const includeDetails = searchParams.get('includeDetails') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    const jdeService = createJDEService();
    
    // Test connection first
    const isConnected = await jdeService.testConnection();
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'JDE connection failed',
        data: {
          purchaseOrders: [],
          purchaseOrderDetails: [],
          summary: {
            totalPOs: 0,
            totalDetails: 0,
            timestamp: new Date().toISOString()
          }
        }
      });
    }
    
    // Get Purchase Order Headers
    const allPurchaseOrders = await jdeService.getPurchaseOrders(poNumber || undefined);
    
    // Enhance with supplier information from F0101 and line item counts
    const enhancedPurchaseOrders = await Promise.all(
      allPurchaseOrders.map(async (po) => {
        try {
          const [supplierInfo, lineItemCount] = await Promise.all([
            jdeService.getSupplierInfo(po.PDAN8),
            jdeService.getLineItemCount(po.PDDOCO)
          ]);
          return {
            ...po,
            PDALPH: supplierInfo.name, // Use real supplier name from F0101
            supplierAddress: supplierInfo.address,
            lineItemCount: lineItemCount // Add real line item count
          };
        } catch (error) {
          console.error(`Error getting supplier info for ${po.PDAN8}:`, error);
          return po;
        }
      })
    );
    
    // Apply pagination
    const totalCount = enhancedPurchaseOrders.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const purchaseOrders = enhancedPurchaseOrders.slice(startIndex, endIndex);
    
    // Get Purchase Order Details if requested
    let purchaseOrderDetails: any[] = [];
    if (includeDetails && poNumber) {
      purchaseOrderDetails = await jdeService.getPurchaseOrderDetails(poNumber);
    }
    
    await jdeService.disconnect();

    return NextResponse.json({
      success: true,
      data: {
        purchaseOrders,
        purchaseOrderDetails,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasNextPage: page < Math.ceil(totalCount / pageSize),
          hasPrevPage: page > 1
        },
        summary: {
          totalPOs: totalCount,
          totalDetails: purchaseOrderDetails.length,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('JDE Purchase Orders fetch error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        purchaseOrders: [],
        purchaseOrderDetails: [],
        summary: {
          totalPOs: 0,
          totalDetails: 0,
          timestamp: new Date().toISOString()
        }
      }
    }, { status: 500 });
  }
} 