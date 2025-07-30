import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';
import oracledb from 'oracledb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const poNumber = searchParams.get('poNumber');
    const poRangeStart = searchParams.get('poRangeStart');
    const poRangeEnd = searchParams.get('poRangeEnd');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const includeDetails = searchParams.get('includeDetails') === 'true';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    
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
            currentPage: 1,
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
    
    // For paginated results, implement lazy loading with search and filters
    
    // Get total count first (fast query)
    const connection = await jdeService.getConnection();
    
    // Build WHERE clause for search and filters
    let poWhereClause = `
      WHERE h.PHDCTO IN ('O2', 'OP', 'O7')
      AND NOT EXISTS (
        SELECT 1 FROM F4311 d 
        WHERE d.PDDOCO = h.PHDOCO 
        AND d.PDLTTR = '999'
      )
    `;
    
    const bindVars: any[] = [];
    let bindIndex = 1;
    
    // Add PO number search (exact match)
    if (poNumber) {
      poWhereClause += ` AND h.PHDOCO = :${bindIndex}`;
      bindVars.push(poNumber);
      bindIndex++;
    }
    
    // Add PO range search
    if (poRangeStart && poRangeEnd) {
      poWhereClause += ` AND h.PHDOCO BETWEEN :${bindIndex} AND :${bindIndex + 1}`;
      bindVars.push(poRangeStart, poRangeEnd);
      bindIndex += 2;
    } else if (poRangeStart) {
      poWhereClause += ` AND h.PHDOCO >= :${bindIndex}`;
      bindVars.push(poRangeStart);
      bindIndex++;
    } else if (poRangeEnd) {
      poWhereClause += ` AND h.PHDOCO <= :${bindIndex}`;
      bindVars.push(poRangeEnd);
      bindIndex++;
    }
    
    // Add search filter
    if (search) {
      poWhereClause += ` AND (
        h.PHDOCO LIKE '%' || :searchTerm1 || '%' OR
        h.PHAN8 LIKE '%' || :searchTerm2 || '%' OR
        h.PHORBY LIKE '%' || :searchTerm3 || '%'
      )`;
      bindVars.push(search, search, search);
      bindIndex += 3;
    }
    
    // Add status filter
    if (status) {
      // Map frontend status values to JDE document types
      let jdeStatus = '';
      switch (status) {
        case 'ACTIVE':
          jdeStatus = 'OP';
          break;
        case 'COMPLETED':
          jdeStatus = 'CL';
          break;
        case 'PENDING':
        case 'PENDING_APPROVAL':
        case 'PARTIALLY_APPROVED':
        case 'APPROVED':
          jdeStatus = 'O2';
          break;
        default:
          jdeStatus = 'O2';
      }
      poWhereClause += ` AND h.PHDCTO = :${bindIndex}`;
      bindVars.push(jdeStatus);
      bindIndex++;
    }
    

    
    // Get total count first
    const countQuery = `
      SELECT COUNT(DISTINCT h.PHDOCO) as total
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
      ${poWhereClause}
    `;
    
    const countResult = await connection.execute(countQuery, bindVars, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    
    const totalCount = parseInt((countResult.rows?.[0] as any)?.TOTAL || '0');
    
    // Get paginated POs with server-side pagination
    const offset = (page - 1) * pageSize;
    const poQuery = `
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
      ${poWhereClause}
      ORDER BY h.PHTRDJ DESC, h.PHDOCO DESC
      OFFSET :${bindIndex} ROWS FETCH NEXT :${bindIndex + 1} ROWS ONLY
    `;
    
    // Add pagination parameters to the existing bind variables
    const poBindVars = [...bindVars, offset, pageSize];
    
    const poResult = await connection.execute(poQuery, poBindVars, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    
    await jdeService.disconnect();
    
    if (!poResult.rows) {
      return NextResponse.json({
        success: true,
        data: {
          purchaseOrders: [],
          pagination: {
            currentPage: page,
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
    
    // Map the data to our interface
    const mappedData = poResult.rows.map((row: any) => {
      // Determine real status based on F4209 approval data
      let status = 'PENDING';
      if (row.HOARTG && row.HOARTG.trim() !== '') {
        // Order requires approval
        if (row.HORPER) {
          status = 'APPROVED'; // Second approver has approved
        } else {
          status = 'PENDING_APPROVAL'; // Waiting for approval
        }
      } else {
        // No approval required, check document status
        if (row.PHDCTO === 'OP') {
          status = 'ACTIVE';
        } else if (row.PHDCTO === 'CL') {
          status = 'COMPLETED';
        } else {
          status = 'PENDING';
        }
      }

      return {
        PDDOCO: String(row.PHDOCO || '').trim(),
        PDAN8: String(row.PHAN8 || '').trim(),
        PDALPH: `Supplier ${row.PHAN8 || 'Unknown'}`,
        PDRQDC: row.PHTRDJ ? new Date(row.PHTRDJ) : new Date(),
        PDPDDJ: row.PHPDDJ ? new Date(row.PHPDDJ) : undefined,
        PDSTS: status,
        PDTOA: parseFloat(row.PHOTOT || 0) / 100,
        PDFAP: parseFloat(row.PHFAP || 0) / 100,
        PDCNDJ: String(row.PHCRCD || 'USD').trim(),
        PDCNDC: 'USD',
        PDBUY: String(row.PHORBY || '').trim(),
        PHMCU: String(row.PHMCU || '').trim(),
        PHDCTO: String(row.PHDCTO || '').trim(),
        lineItemCount: 0, // Will be updated later
        // Approval information (only second approver)
        HORPER: row.HORPER,
        HOARTG: String(row.HOARTG || '').trim(),
        DB_NAME: String(row.DB_NAME || '').trim()
      };
    });
    
    // Enhance with supplier info and line counts (lazy loading)
    const enhancedPurchaseOrders = await Promise.all(
      mappedData.map(async (po) => {
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
          currentPage: page,
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