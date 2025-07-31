import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';
import { formatQuantityForTable } from '@/lib/quantity-formatter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      format = 'csv', 
      filters = {}, 
      selectedItems = [],
      includeHeaders = true 
    } = body;

    const jdeService = createJDEService();
    
    // Get inventory data based on filters or selected items
    let inventoryData;
    
    if (selectedItems && selectedItems.length > 0) {
      // Export only selected items
      inventoryData = [];
      for (const itemNumber of selectedItems) {
        const items = await jdeService.getInventoryLevels(itemNumber);
        if (items.length > 0) {
          inventoryData.push(items[0]);
        }
      }
    } else {
      // Export filtered data (get all items and apply filters)
      const allItems = await jdeService.getAllInventoryItems();
      
      // Apply filters
      inventoryData = allItems.filter(item => {
        // GL Class filter
        if (filters.glClass && item.IMGLPT !== filters.glClass) return false;
        
        // Business Unit filter
        if (filters.businessUnit && item.LIMCU !== filters.businessUnit) return false;
        
        // Status filter
        if (filters.status && item.StockStatus !== filters.status) return false;
        
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return item.IMITM.toLowerCase().includes(searchLower) ||
                 item.IMLITM.toLowerCase().includes(searchLower);
        }
        
        return true;
      });
    }

    await jdeService.disconnect();

    if (format.toLowerCase() === 'csv') {
      return generateCSV(inventoryData, includeHeaders);
    } else if (format.toLowerCase() === 'excel' || format.toLowerCase() === 'xlsx') {
      return generateExcel(inventoryData, includeHeaders);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Unsupported format. Use "csv" or "excel"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Export error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateCSV(data: any[], includeHeaders: boolean): NextResponse {
  const headers = [
    'Item Number',
    'Item Description',
    'Business Unit',
    'GL Class',
    'Primary UOM',
    'Purchasing UOM',
    'Total Qty On Hand',
    'Available Stock',
    'Total Qty On Order',
    'Total Hard Commit',
    'Total Soft Commit',
    'Total In Transit',
    'Total Backorder',
    'Net Stock',
    'Stock Status',
    'Safety Stock',
    'Min Order Qty',
    'Lot Size',
    'Buyer',
    'Product Group',
    'Dispatch Group'
  ];

  const csvRows = [];

  if (includeHeaders) {
    csvRows.push(headers.join(','));
  }

  for (const item of data) {
    const row = [
      `"${item.IMITM}"`,
      `"${item.IMLITM}"`,
      `"${item.LIMCU}"`,
      `"${item.IMGLPT}"`,
      `"${item.IMUOM1}"`,
      `"${item.IMUOM3}"`,
      formatQuantityForTable(item.TotalQOH, item.IMUOM1),
      formatQuantityForTable(item.AvailableStock, item.IMUOM1),
      formatQuantityForTable(item.TotalQOO, item.IMUOM1),
      formatQuantityForTable(item.TotalHardCommit, item.IMUOM1),
      formatQuantityForTable(item.TotalSoftCommit, item.IMUOM1),
      formatQuantityForTable(item.TotalInTransit || 0, item.IMUOM1),
      formatQuantityForTable(item.TotalBackorder || 0, item.IMUOM1),
      formatQuantityForTable(item.NetStock, item.IMUOM1),
      `"${item.StockStatus}"`,
      item.IMSSQ,
      item.IMMOQ,
      item.IMLOTS,
      `"${item.IMBUY}"`,
      `"${item.IMCC}"`,
      `"${item.IMPL}"`
    ];
    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n');
  const filename = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function generateExcel(data: any[], includeHeaders: boolean): NextResponse {
  // For Excel, we'll use a simple CSV format with .xlsx extension
  // In a production environment, you might want to use a library like 'xlsx' or 'exceljs'
  const headers = [
    'Item Number',
    'Item Description', 
    'Business Unit',
    'GL Class',
    'Primary UOM',
    'Purchasing UOM',
    'Total Qty On Hand',
    'Available Stock',
    'Total Qty On Order',
    'Total Hard Commit',
    'Total Soft Commit',
    'Total In Transit',
    'Total Backorder',
    'Net Stock',
    'Stock Status',
    'Safety Stock',
    'Min Order Qty',
    'Lot Size',
    'Buyer',
    'Product Group',
    'Dispatch Group'
  ];

  const csvRows = [];

  if (includeHeaders) {
    csvRows.push(headers.join('\t'));
  }

  for (const item of data) {
    const row = [
      item.IMITM,
      item.IMLITM,
      item.LIMCU,
      item.IMGLPT,
      item.IMUOM1,
      item.IMUOM3,
      formatQuantityForTable(item.TotalQOH, item.IMUOM1),
      formatQuantityForTable(item.AvailableStock, item.IMUOM1),
      formatQuantityForTable(item.TotalQOO, item.IMUOM1),
      formatQuantityForTable(item.TotalHardCommit, item.IMUOM1),
      formatQuantityForTable(item.TotalSoftCommit, item.IMUOM1),
      formatQuantityForTable(item.TotalInTransit || 0, item.IMUOM1),
      formatQuantityForTable(item.TotalBackorder || 0, item.IMUOM1),
      formatQuantityForTable(item.NetStock, item.IMUOM1),
      item.StockStatus,
      item.IMSSQ,
      item.IMMOQ,
      item.IMLOTS,
      item.IMBUY,
      item.IMCC,
      item.IMPL
    ];
    csvRows.push(row.join('\t'));
  }

  const excelContent = csvRows.join('\n');
  const filename = `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`;

  return new NextResponse(excelContent, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
} 