import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';
import oracledb from 'oracledb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const poNumber = searchParams.get('poNumber');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const includeDetails = searchParams.get('includeDetails') === 'true';
    
    const jdeService = createJDEService();
    
    // Test connection first
    const isConnected = await jdeService.testConnection();
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        message: 'JDE connection failed',
        data: {
          purchaseOrders: [],
          pagination: {
            page: 1,
            pageSize: 10,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          summary: {
            totalPOs: 0,
            totalDetails: 0,
            timestamp: new Date().toISOString()
          }
        }
      });
    }
    
    // For specific PO, get it directly
    if (poNumber) {
      const allPurchaseOrders = await jdeService.getPurchaseOrders(poNumber);
      const enhancedPurchaseOrders = await Promise.all(
        allPurchaseOrders.map(async (po) => {
          try {
            const [supplierInfo, lineItemCount] = await Promise.all([
              jdeService.getSupplierInfo(po.PDAN8),
              jdeService.getLineItemCount(po.PDDOCO)
            ]);
            return {
              ...po,
              PDALPH: supplierInfo.name,
              supplierAddress: supplierInfo.address,
              lineItemCount: lineItemCount
            };
          } catch (error) {
            console.error(`Error getting supplier info for ${po.PDAN8}:`, error);
            return po;
          }
        })
      );
      
      await jdeService.disconnect();
      
      return NextResponse.json({
        success: true,
        data: {
          purchaseOrders: enhancedPurchaseOrders,
          pagination: {
            page: 1,
            pageSize: 1,
            totalCount: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          },
          summary: {
            totalPOs: 1,
            totalDetails: 0,
            timestamp: new Date().toISOString()
          }
        }
      });
    }
    
    // For paginated results, implement lazy loading
    
    // Get total count first (fast query)
    const connection = await jdeService.getConnection();
    const countQuery = `
      SELECT COUNT(DISTINCT h.PHDOCO) as total
      FROM F4301 h
      WHERE h.PHDCTO IN ('O2', 'OP', 'O7')
      AND NOT EXISTS (
        SELECT 1 FROM F4311 d 
        WHERE d.PDDOCO = h.PHDOCO 
        AND d.PDLTTR = '999'
      )
    `;
    
    const countResult = await connection.execute(countQuery, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    
    const totalCount = parseInt((countResult.rows?.[0] as any)?.TOTAL || '0');
    
    // Get paginated POs with server-side pagination
    const offset = (page - 1) * pageSize;
    const poQuery = `
      SELECT DISTINCT
        h.PHDOCO, h.PHAN8, h.PHTRDJ, h.PHDRQJ, h.PHPDDJ, h.PHCNDJ, h.PHOTOT, h.PHFAP, h.PHCRCD, h.PHBCRC, h.PHORBY, h.PHDCTO, h.PHMCU
      FROM F4301 h
      WHERE h.PHDCTO IN ('O2', 'OP', 'O7')
      AND NOT EXISTS (
        SELECT 1 FROM F4311 d 
        WHERE d.PDDOCO = h.PHDOCO 
        AND d.PDLTTR = '999'
      )
      ORDER BY h.PHTRDJ DESC
      OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
    `;
    
    const poResult = await connection.execute(poQuery, [offset, pageSize], {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    
    await jdeService.disconnect();
    
    if (!poResult.rows) {
      return NextResponse.json({
        success: true,
        data: {
          purchaseOrders: [],
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
            totalDetails: 0,
            timestamp: new Date().toISOString()
          }
        }
      });
    }
    
    // Use the same date parsing logic as the JDE connector
    const parseJDEDate = (jdeDate: any): Date => {
      if (!jdeDate) return new Date();
      
      if (jdeDate instanceof Date) return jdeDate;
      
      if (typeof jdeDate === 'number') {
        const year = Math.floor(jdeDate / 1000);
        const dayOfYear = jdeDate % 1000;
        
        let fullYear = year;
        if (year >= 100) {
          fullYear = year + 1900;
        } else if (year >= 50) {
          fullYear = year + 1900;
        } else {
          fullYear = year + 2000;
        }
        
        return new Date(fullYear, 0, dayOfYear);
      }
      
      if (typeof jdeDate === 'string') {
        const parsed = new Date(jdeDate);
        if (!isNaN(parsed.getTime())) return parsed;
      }
      
      return new Date();
    };
    
    // Convert to JDEPurchaseOrderHeader format
    const purchaseOrders = (poResult.rows || []).map((row: any) => ({
      PDDOCO: String(row.PHDOCO || '').trim(),
      PDAN8: String(row.PHAN8 || '').trim(),
      PDALPH: `Supplier ${row.PHAN8 || 'Unknown'}`,
      PDRQDC: parseJDEDate(row.PHTRDJ), // Order Date (when PO was created)
      PDPDDJ: row.PHPDDJ ? parseJDEDate(row.PHPDDJ) : undefined, // Promise Date
      PDSTS: row.PHDCTO === 'OP' ? 'ACTIVE' : 'PENDING',
      PDTOA: (parseFloat(row.PHOTOT) || 0) / 100,
      PDFAP: parseFloat(row.PHFAP) || 0,
      PDCNDJ: String(row.PHCRCD || 'USD').trim(),
      PDCNDC: 'USD',
      PDBUY: String(row.PHORBY || 'BUYER1').trim(),
      PHMCU: String(row.PHMCU || '').trim(),
      PHDCTO: String(row.PHDCTO || '').trim(),
      lineItemCount: 0
    }));
    
    // Enhance with supplier info and line counts (lazy loading)
    const enhancedPurchaseOrders = await Promise.all(
      purchaseOrders.map(async (po) => {
        try {
          const [supplierInfo, lineItemCount] = await Promise.all([
            jdeService.getSupplierInfo(po.PDAN8),
            jdeService.getLineItemCount(po.PDDOCO)
          ]);
          return {
            ...po,
            PDALPH: supplierInfo.name,
            supplierAddress: supplierInfo.address,
            lineItemCount: lineItemCount
          };
        } catch (error) {
          console.error(`Error getting supplier info for ${po.PDAN8}:`, error);
          return po;
        }
      })
    );
    
    return NextResponse.json({
      success: true,
      data: {
        purchaseOrders: enhancedPurchaseOrders,
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
          totalDetails: 0,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('JDE Purchase Orders optimized fetch error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        purchaseOrders: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        summary: {
          totalPOs: 0,
          totalDetails: 0,
          timestamp: new Date().toISOString()
        }
      }
    }, { status: 500 });
  }
} 