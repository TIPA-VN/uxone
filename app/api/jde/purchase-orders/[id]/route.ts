import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const poNumber = params.id;
    
    if (!poNumber) {
      return NextResponse.json({
        success: false,
        message: 'PO Number is required',
        data: null
      }, { status: 400 });
    }
    
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
    
    // Get Purchase Order Header from F4301
    const purchaseOrders = await jdeService.getPurchaseOrders(poNumber);
    const purchaseOrderHeader = purchaseOrders[0];
    
    if (!purchaseOrderHeader) {
      return NextResponse.json({
        success: false,
        message: `Purchase Order ${poNumber} not found`,
        data: null
      }, { status: 404 });
    }
    
    // Get Purchase Order Details from F4311
    const lineDetails = await jdeService.getPurchaseOrderDetails(poNumber);
    
    // Enhance with supplier information from F0101
    let enhancedHeader = purchaseOrderHeader;
    try {
      const supplierInfo = await jdeService.getSupplierInfo(purchaseOrderHeader.PDAN8);
      enhancedHeader = {
        ...purchaseOrderHeader,
        PDALPH: supplierInfo.name, // Use real supplier name from F0101
        supplierAddress: supplierInfo.address
      };
    } catch (error) {
      console.error(`Error getting supplier info for ${purchaseOrderHeader.PDAN8}:`, error);
    }
    
    await jdeService.disconnect();

    return NextResponse.json({
      success: true,
      data: {
        purchaseOrder: enhancedHeader,
        lineDetails,
        summary: {
          totalLines: lineDetails.length,
          totalQuantity: lineDetails.reduce((sum, line) => sum + line.PDQTOR, 0),
          totalReceived: lineDetails.reduce((sum, line) => sum + line.PDRQTOR, 0),
          totalValue: lineDetails.reduce((sum, line) => sum + line.PDEXRC, 0),
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('JDE Purchase Order Details fetch error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }, { status: 500 });
  }
} 