import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';
import oracledb from 'oracledb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: poNumber } = await params;
    
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
    
    const connection = await jdeService.getConnection();
    
    // Get Purchase Order Header with approval information from F4301, F4209, and F0101
    const headerQuery = `
      SELECT DISTINCT
        h.PHDOCO, h.PHAN8, h.PHTRDJ, h.PHDRQJ, h.PHPDDJ, h.PHCNDJ, h.PHOTOT, h.PHFAP, h.PHCRCD, h.PHBCRC, h.PHORBY, h.PHDCTO, h.PHMCU,
        r.HORPER, r.HOARTG, r.HORDB, r.HODOCO,
        per.ABALPH as DB_NAME
      FROM F4301 h
      LEFT JOIN (
        SELECT HODOCO, HORPER, HOARTG, HORDB
        FROM (
          SELECT HODOCO, HORPER, HOARTG, HORDB,
                 ROW_NUMBER() OVER (PARTITION BY HODOCO ORDER BY HORPER) as rn
          FROM F4209
        ) ranked
        WHERE rn = 1
      ) r ON h.PHDOCO = r.HODOCO
      LEFT JOIN F0101 per ON r.HORPER = per.ABAN8
      WHERE h.PHDOCO = :poNumber
    `;
    
    const headerResult = await connection.execute(headerQuery, [poNumber], {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    
    if (!headerResult.rows || headerResult.rows.length === 0) {
      await jdeService.disconnect();
      return NextResponse.json({
        success: false,
        message: `Purchase Order ${poNumber} not found`,
        data: null
      }, { status: 404 });
    }
    
    const headerRow = headerResult.rows[0] as any;
    
    // Determine real status based on F4209 approval data
    let status = 'PENDING';
    if (headerRow.HOARTG && headerRow.HOARTG.trim() !== '') {
      // Order requires approval
      if (headerRow.HORPER) {
        status = 'APPROVED'; // Second approver has approved
      } else {
        status = 'PENDING_APPROVAL'; // Waiting for approval
      }
    } else {
      // No approval required, check document status
      if (headerRow.PHDCTO === 'OP') {
        status = 'ACTIVE';
      } else if (headerRow.PHDCTO === 'CL') {
        status = 'COMPLETED';
      } else {
        status = 'PENDING';
      }
    }
    
    // Map header data to our interface
    const purchaseOrderHeader = {
      PDDOCO: String(headerRow.PHDOCO || '').trim(),
      PDAN8: String(headerRow.PHAN8 || '').trim(),
      PDALPH: '', // Will be enhanced with supplier info
      PDRQDC: parseInt(headerRow.PHTRDJ) || 0,  // Order Date
      PHDRQJ: parseInt(headerRow.PHDRQJ) || 0,  // Request Date
      PDPDDJ: headerRow.PHPDDJ ? parseInt(headerRow.PHPDDJ) : undefined,  // Promise Date
      PDSTS: status,
      PDTOA: parseFloat(headerRow.PHOTOT || 0) / 100,
      PDFAP: parseFloat(headerRow.PHFAP || 0) / 100,
      PDCNDJ: String(headerRow.PHCRCD || 'USD').trim(),
      PDCNDC: 'USD',
      PDBUY: String(headerRow.PHORBY || '').trim(),
      PHMCU: String(headerRow.PHMCU || '').trim(),
      PHDCTO: String(headerRow.PHDCTO || '').trim(),
      lineItemCount: 0, // Will be updated after getting details
      supplierAddress: '',
      // Approval information (only second approver)
      DB_NAME: String(headerRow.DB_NAME || '').trim(),
      HORPER: headerRow.HORPER,
      HORDB: String(headerRow.HORDB || '').trim(),
      HOARTG: String(headerRow.HOARTG || '').trim()
    };
    
    // Get Purchase Order Details from F4311
    const lineDetails = await jdeService.getPurchaseOrderDetails(poNumber);
    
    // Update line item count
    purchaseOrderHeader.lineItemCount = lineDetails.length;
    
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