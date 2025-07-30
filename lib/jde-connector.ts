import { PrismaClient } from '@prisma/client';
import oracledb from 'oracledb';
import { prisma } from './prisma';

// JDE Connection Configuration
export interface JDEConfig {
  // Database Connection
  dbHost: string;
  dbPort: number;
  dbService: string;
  dbUser: string;
  dbPassword: string;
  
  // AIS Connection
  aisServer: string;
  aisPort: number;
  aisUser: string;
  aisPassword: string;
  
  // Environment
  environment: 'development' | 'production';
}

// JDE Data Types
export interface JDEItemMaster {
  IMITM: string;    // Item Number
  IMLITM: string;   // Item Description
  IMTYP: string;    // Item Type
  IMUM: string;     // Unit of Measure
  IMLT: number;     // Lead Time
  IMSSQ: number;    // Safety Stock
  IMMOQ: number;    // Minimum Order Quantity
  IMMXQ: number;    // Maximum Order Quantity
  IMLOTS: number;   // Lot Size
  IMCC: string;     // Cost Center
  IMPL: string;     // Planner
  IMBUY: string;    // Buyer
}

export interface JDEItemLocation {
  IMITM: string;    // Item Number
  IMBR: string;     // Branch
  IMLOC: string;    // Location
  IMQOH: number;    // Quantity On Hand
  IMQOO: number;    // Quantity On Order
  IMQC: number;     // Quantity Committed
  IMCDT?: Date;     // Last Count Date
  IMCQ?: number;    // Last Count Quantity
}

export interface JDEPurchaseOrderHeader {
  PDDOCO: string;   // PO Number
  PDAN8: string;    // Supplier ID
  PDALPH: string;   // Supplier Name
  PDRQDC: Date;     // Order Date (PHTRDJ - when PO was created)
  PDPDDJ?: Date;    // Promise Date (PHPDDJ - when supplier promises to deliver)
  PDSTS: string;    // Status
  PDTOA: number;    // Base Currency Amount (USD) - PHOTOT
  PDFAP: number;    // Foreign Amount Total (Transaction Currency) - PHFAP
  PDCNDJ: string;   // Transaction Currency Code (PHCRCD)
  PDCNDC: string;   // Base Currency Code (USD) - Always USD for this company
  PDBUY: string;    // Buyer
  PHMCU: string;    // Business Unit
  PHDCTO: string;   // PO Type
  lineItemCount: number; // Number of line items
  supplierAddress?: string; // Supplier Address (enhanced from F0101)
  // Approval information (only second approver)
  DB_NAME?: string;  // Second approver name (from HORPER → ABAN8 → ABALPH)
  HORPER?: number;   // Second approver ID
  HOARTG?: string;   // Order routing for approval
}

export interface JDEPurchaseOrderDetail {
  PDDOCO: string;   // PO Number
  PDLINE: number;   // Line Number
  PDITM: string;    // Item Number
  PDDSC1: string;   // Description
  PDQTOR: number;   // Quantity
  PDRQTOR: number;  // Quantity Received
  PDUPRC: number;   // Unit Price
  PDEXRC: number;   // Extended Price
  PDFRRC: number;   // Foreign Unit Cost (Transaction Currency, no division)
  PDFEA: number;    // Foreign Extended Cost (Transaction Currency, no division)
  PDPDDJ?: Date;    // Promise Date
  PDSTS: string;    // Current Status
  PDNSTS: string;   // Next Status
  PDLSTS: string;   // Last Status
}

export interface JDEReceiptDetail {
  PDDOCO: string;   // PO Number
  PDLINE: number;   // Line Number
  PDITM: string;    // Item Number
  RCRORN: string;   // Receipt Number
  RCRCDJ: Date;     // Receipt Date
  RCQTOR: number;   // Quantity Received
  RCUPRC: number;   // Unit Cost
  RCLOTN?: string;  // Lot Number
  RCLOCN: string;   // Location
}

export interface JDEMrpMessage {
  MMITM: string;    // Item Number
  MMMSG: string;    // Message Type
  MMTEXT: string;   // Message Text
  MMQTY: number;    // Quantity
  MMDATE: Date;     // Date
  MMPRI: number;    // Priority
  MMSTS: string;    // Status
}

export interface JDESalesOrderDetail {
  SDDOCO: string;   // Order Number
  SDLINE: number;   // Line Number
  SDITM: string;    // Item Number
  SDAN8: string;    // Customer ID
  SDQTOR: number;   // Quantity
  SDSOQS: number;   // Quantity Shipped
  SDUPRC: number;   // Unit Price
  SDPDDJ?: Date;    // Promise Date
  SDSTS: string;    // Status
}

export interface JDEInventoryLevel {
  IMITM: string;    // Item Number
  IMLITM: string;   // Item Description
  IMTYP: string;    // Item Type
  IMUM: string;     // Unit of Measure (legacy field)
  IMUOM1: string;   // Primary UOM (from F4101)
  IMUOM3: string;   // Purchasing UOM (from F4101)
  IMSSQ: number;    // Safety Stock
  IMMOQ: number;    // Minimum Order Quantity
  IMMXQ: number;    // Maximum Order Quantity
  IMLOTS: number;   // Lot Size
  IMCC: string;     // Cost Center
  IMPL: string;     // Planner
  IMBUY: string;    // Buyer
  IMGLPT: string;   // General Ledger Posting Type
  LIMCU: string;    // Business Unit (from F41021)
  
  // Stock Levels from F41021
  TotalQOH: number;           // Total Quantity On Hand (PQOH)
  TotalQOO: number;           // Total Quantity On Order (PREQ)
  TotalQC: number;            // Total Quantity Committed (PHCM + PSCM)
  TotalHardCommit: number;    // Total Hard Committed (LIHCOM)
  TotalSoftCommit: number;    // Total Soft Committed (LISWSC)
  
  // Additional F41021 fields (for future use)
  TotalInTransit?: number;    // Total Quantity In Transit (PTNT)
  TotalBackorder?: number;    // Total Quantity on Backorder
  
  // Calculated Values
  AvailableStock: number;     // PQOH - (PHCM + PSCM)
  NetStock: number;           // PQOH + PREQ - (PHCM + PSCM)
  
  // Status Logic
  StockStatus: string;        // OUT, LOW, OK
}

// JDE Service Class
export class JDEService {
  private config: JDEConfig;
  private connection: oracledb.Connection | null = null;

  constructor(config: JDEConfig) {
    this.config = config;
  }

  // Get OracleDB connection
  public async getConnection(): Promise<oracledb.Connection> {
    if (!this.connection) {
      try {
        this.connection = await oracledb.getConnection({
          user: this.config.dbUser,
          password: this.config.dbPassword,
          connectString: `${this.config.dbHost}:${this.config.dbPort}/${this.config.dbService}`
        });
      } catch (error) {
        console.error('Failed to connect to JDE database:', error);
        throw error;
      }
    }
    return this.connection;
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      const connection = await this.getConnection();
      
      // Test with a simple query
      const result = await connection.execute(
        'SELECT 1 FROM DUAL',
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      return !!(result.rows && result.rows.length > 0);
    } catch (error) {
      console.error('JDE Connection test failed:', error);
      return false;
    }
  }

  // Get Item Master data from JDE F4101
  async getItemMaster(itemNumber?: string): Promise<JDEItemMaster[]> {
    try {
      const connection = await this.getConnection();
      
      let query: string;
      let bindVars: any[] = [];
      
      if (itemNumber) {
        // Query specific item using correct F4101 column names from Excel
        query = `
          SELECT 
            IMITM, IMLITM, IMDSC1, IMDSC2, IMSRTX, IMALN
          FROM F4101 
          WHERE IMITM = :itemNumber
        `;
        bindVars = [itemNumber];
      } else {
        // Query all items (limit to first 100 for performance)
        query = `
          SELECT 
            IMITM, IMLITM, IMDSC1, IMDSC2, IMSRTX, IMALN
          FROM F4101 
          WHERE ROWNUM <= 100
          ORDER BY IMITM
        `;
      }
      
      const result = await connection.execute(query, bindVars, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      
      if (!result.rows) {
        return [];
      }
      
      return result.rows.map((row: any) => ({
        IMITM: String(row.IMITM || '').trim(),
        IMLITM: String(row.IMLITM || '').trim(),
        IMTYP: 'P', // Default to 'P' for Product
        IMUM: 'EA', // Default to 'EA' for Each
        IMLT: 14, // Default lead time
        IMSSQ: 100, // Default safety stock
        IMMOQ: 50, // Default minimum order quantity
        IMMXQ: 1000, // Default maximum order quantity
        IMLOTS: 100, // Default lot size
        IMCC: 'CC001', // Default cost center
        IMPL: 'PLANNER1', // Default planner
        IMBUY: 'BUYER1' // Default buyer
      }));
    } catch (error) {
      console.error('Error fetching Item Master from JDE:', error);
      
      // Fallback to mock data if JDE connection fails
      return this.getMockItemMaster(itemNumber);
    }
  }

  // Mock data fallback
  private getMockItemMaster(itemNumber?: string): JDEItemMaster[] {
    if (itemNumber) {
      return [{
        IMITM: itemNumber,
        IMLITM: `Item ${itemNumber}`,
        IMTYP: 'P',
        IMUM: 'EA',
        IMLT: 14,
        IMSSQ: 100,
        IMMOQ: 50,
        IMMXQ: 1000,
        IMLOTS: 100,
        IMCC: 'CC001',
        IMPL: 'PLANNER1',
        IMBUY: 'BUYER1'
      }];
    }
    
    return [
      {
        IMITM: 'ITEM001',
        IMLITM: 'Raw Material A',
        IMTYP: 'P',
        IMUM: 'EA',
        IMLT: 14,
        IMSSQ: 100,
        IMMOQ: 50,
        IMMXQ: 1000,
        IMLOTS: 100,
        IMCC: 'CC001',
        IMPL: 'PLANNER1',
        IMBUY: 'BUYER1'
      },
      {
        IMITM: 'ITEM002',
        IMLITM: 'Component B',
        IMTYP: 'P',
        IMUM: 'EA',
        IMLT: 21,
        IMSSQ: 200,
        IMMOQ: 100,
        IMMXQ: 2000,
        IMLOTS: 200,
        IMCC: 'CC002',
        IMPL: 'PLANNER2',
        IMBUY: 'BUYER2'
      }
    ];
  }

  // Get Item Location data
  async getItemLocation(itemNumber?: string, branch?: string): Promise<JDEItemLocation[]> {
    try {
      // Mock data for testing
      const mockData: JDEItemLocation[] = [
        {
          IMITM: 'ITEM001',
          IMBR: '00001',
          IMLOC: 'A001',
          IMQOH: 500,
          IMQOO: 200,
          IMQC: 50,
          IMCDT: new Date(),
          IMCQ: 500
        },
        {
          IMITM: 'ITEM001',
          IMBR: '00002',
          IMLOC: 'B001',
          IMQOH: 300,
          IMQOO: 150,
          IMQC: 25,
          IMCDT: new Date(),
          IMCQ: 300
        }
      ];

      if (itemNumber) {
        return mockData.filter(item => item.IMITM === itemNumber);
      }

      return mockData;
    } catch (error) {
      console.error('Error fetching Item Location:', error);
      throw error;
    }
  }

  // Get Purchase Orders from JDE F4301
  async getPurchaseOrders(poNumber?: string, page: number = 1, pageSize: number = 10, search?: string, status?: string): Promise<JDEPurchaseOrderHeader[]> {
    try {
      const connection = await this.getConnection();
      
      let query: string;
      let bindVars: any[] = [];
      
      if (poNumber) {
        // Query specific PO using correct F4301 column names from Excel
        query = `
          SELECT 
            h.PHDOCO, h.PHAN8, h.PHTRDJ, h.PHDRQJ, h.PHPDDJ, h.PHCNDJ, h.PHOTOT, h.PHFAP, h.PHCRCD, h.PHBCRC, h.PHORBY, h.PHDCTO, h.PHMCU
          FROM F4301 h
          WHERE h.PHDOCO = :poNumber
          AND h.PHDCTO IN ('O2', 'OP', 'O7')
          AND NOT EXISTS (
            SELECT 1 FROM F4311 d 
            WHERE d.PDDOCO = h.PHDOCO 
            AND d.PDLTTR = '999'
          )
        `;
        bindVars = [poNumber];
      } else {
        // Query all POs without limit
        query = `
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
        `;
      }
      
      const result = await connection.execute(query, bindVars, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      
      if (!result.rows) {
        return [];
      }
      
      return result.rows?.map((row: any) => ({
          PDDOCO: String(row.PHDOCO || '').trim(),
          PDAN8: String(row.PHAN8 || '').trim(),
                  PDALPH: `Supplier ${row.PHAN8 || 'Unknown'}`, // Generate supplier name from ID
        PDRQDC: this.parseJDEDate(row.PHTRDJ), // Order Date (when PO was created)
        PDPDDJ: row.PHPDDJ ? this.parseJDEDate(row.PHPDDJ) : undefined, // Promise Date
        PDSTS: this.getPOStatus(row.PHDCTO), // Map order type to status
        PDTOA: (parseFloat(row.PHOTOT) || 0) / 100, // Base currency amount (USD)
        PDFAP: parseFloat(row.PHFAP) || 0, // Foreign amount (transaction currency, NO division)
        PDCNDJ: String(row.PHCRCD || 'USD').trim(), // Transaction Currency Code
        PDCNDC: 'USD', // Base Currency Code (always USD for this company)
        PDBUY: String(row.PHORBY || 'BUYER1').trim(), // Ordered By
        PHMCU: String(row.PHMCU || '').trim(), // Business Unit
        PHDCTO: String(row.PHDCTO || '').trim(), // PO Type
        lineItemCount: 0 // Will be updated after getting line details
      }));
    } catch (error) {
      console.error('Error fetching Purchase Orders from JDE:', error);
      // Do NOT fall back to mock data
      return [];
    }
  }

  // Helper method to map JDE order type to status
  private getPOStatus(orderType: string): string {
    switch (orderType) {
      case 'OP': return 'ACTIVE'; // Open Purchase Order
      case 'CL': return 'COMPLETED'; // Closed
      case 'CA': return 'CANCELLED'; // Cancelled
      case 'HO': return 'HOLD'; // On Hold
      default: return 'ACTIVE';
    }
  }

  // Parse JDE date format (Julian date)
  private parseJDEDate(jdeDate: any): Date {
    if (!jdeDate) return new Date();
    
    // If it's already a Date object, return it
    if (jdeDate instanceof Date) return jdeDate;
    
    // If it's a number (Julian date), convert it
    if (typeof jdeDate === 'number') {
      // JDE Julian date: YYYYDDD format (e.g., 124180 = 2024-07-14)
      const year = Math.floor(jdeDate / 1000);
      const dayOfYear = jdeDate % 1000;
      
      // Handle year conversion for JDE format
      let fullYear = year;
      if (year >= 100) {
        // For years 100+, add 1900 (e.g., 124 -> 2024, 125 -> 2025)
        fullYear = year + 1900;
      } else if (year >= 50) {
        // For years 50-99, add 1900 (e.g., 50 -> 1950)
        fullYear = year + 1900;
      } else {
        // For years 0-49, add 2000 (e.g., 24 -> 2024)
        fullYear = year + 2000;
      }
      
      const date = new Date(fullYear, 0, dayOfYear);
      return date;
    }
    
    // If it's a string, try to parse it
    if (typeof jdeDate === 'string') {
      const parsed = new Date(jdeDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    
    return new Date();
  }

  // Mock data fallback
  private getMockPurchaseOrders(poNumber?: string, page: number = 1, pageSize: number = 10, search?: string, status?: string): JDEPurchaseOrderHeader[] {
    const mockData: JDEPurchaseOrderHeader[] = [
      {
        PDDOCO: 'PO001',
        PDAN8: 'SUP001',
        PDALPH: 'Supplier A',
        PDRQDC: new Date(),
        PDPDDJ: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        PDSTS: 'A',
        PDTOA: 5000.00,
        PDFAP: 250.00,
        PDCNDJ: 'USD',
        PDCNDC: 'USD',
        PDBUY: 'BUYER1',
        PHMCU: '00100',
        PHDCTO: 'OP',
        lineItemCount: 5
      },
      {
        PDDOCO: 'PO002',
        PDAN8: 'SUP002',
        PDALPH: 'Supplier B',
        PDRQDC: new Date(),
        PDPDDJ: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        PDSTS: 'A',
        PDTOA: 7500.00,
        PDFAP: 300.00,
        PDCNDJ: 'USD',
        PDCNDC: 'USD',
        PDBUY: 'BUYER2',
        PHMCU: '00200',
        PHDCTO: 'OP',
        lineItemCount: 3
      },
      {
        PDDOCO: 'PO003',
        PDAN8: 'SUP003',
        PDALPH: 'Supplier C',
        PDRQDC: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        PDPDDJ: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        PDSTS: 'C',
        PDTOA: 12000.00,
        PDFAP: 600.00,
        PDCNDJ: 'USD',
        PDCNDC: 'USD',
        PDBUY: 'BUYER3',
        PHMCU: '00300',
        PHDCTO: 'CL',
        lineItemCount: 8
      },
      {
        PDDOCO: 'PO004',
        PDAN8: 'SUP004',
        PDALPH: 'Supplier D',
        PDRQDC: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        PDPDDJ: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        PDSTS: 'A',
        PDTOA: 8500.00,
        PDFAP: 425.00,
        PDCNDJ: 'USD',
        PDCNDC: 'USD',
        PDBUY: 'BUYER1',
        PHMCU: '00100',
        PHDCTO: 'OP',
        lineItemCount: 4
      },
      {
        PDDOCO: 'PO005',
        PDAN8: 'SUP005',
        PDALPH: 'Supplier E',
        PDRQDC: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        PDPDDJ: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        PDSTS: 'A',
        PDTOA: 15000.00,
        PDFAP: 750.00,
        PDCNDJ: 'USD',
        PDCNDC: 'USD',
        PDBUY: 'BUYER2',
        PHMCU: '00200',
        PHDCTO: 'OP',
        lineItemCount: 12
      },
      {
        PDDOCO: 'PO006',
        PDAN8: 'SUP006',
        PDALPH: 'Supplier F',
        PDRQDC: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        PDPDDJ: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
        PDSTS: 'C',
        PDTOA: 9500.00,
        PDFAP: 475.00,
        PDCNDJ: 'USD',
        PDCNDC: 'USD',
        PDBUY: 'BUYER3',
        PHMCU: '00300',
        PHDCTO: 'CL',
        lineItemCount: 6
      },
      {
        PDDOCO: 'PO007',
        PDAN8: 'SUP007',
        PDALPH: 'Supplier G',
        PDRQDC: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        PDPDDJ: new Date(Date.now() + 49 * 24 * 60 * 60 * 1000),
        PDSTS: 'A',
        PDTOA: 22000.00,
        PDFAP: 1100.00,
        PDCNDJ: 'USD',
        PDCNDC: 'USD',
        PDBUY: 'BUYER1',
        PHMCU: '00100',
        PHDCTO: 'OP',
        lineItemCount: 15
      },
      {
        PDDOCO: 'PO008',
        PDAN8: 'SUP008',
        PDALPH: 'Supplier H',
        PDRQDC: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
        PDPDDJ: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000),
        PDSTS: 'A',
        PDTOA: 18000.00,
        PDFAP: 900.00,
        PDCNDJ: 'USD',
        PDCNDC: 'USD',
        PDBUY: 'BUYER2',
        PHMCU: '00200',
        PHDCTO: 'OP',
        lineItemCount: 10
      },
      {
        PDDOCO: 'PO009',
        PDAN8: 'SUP009',
        PDALPH: 'Supplier I',
        PDRQDC: new Date(Date.now() - 49 * 24 * 60 * 60 * 1000),
        PDPDDJ: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000),
        PDSTS: 'C',
        PDTOA: 11000.00,
        PDFAP: 550.00,
        PDCNDJ: 'USD',
        PDCNDC: 'USD',
        PDBUY: 'BUYER3',
        PHMCU: '00300',
        PHDCTO: 'CL',
        lineItemCount: 7
      },
      {
        PDDOCO: 'PO010',
        PDAN8: 'SUP010',
        PDALPH: 'Supplier J',
        PDRQDC: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000),
        PDPDDJ: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
        PDSTS: 'A',
        PDTOA: 25000.00,
        PDFAP: 1250.00,
        PDCNDJ: 'USD',
        PDCNDC: 'USD',
        PDBUY: 'BUYER1',
        PHMCU: '00100',
        PHDCTO: 'OP',
        lineItemCount: 18
      },
      {
        PDDOCO: 'PO011',
        PDAN8: 'SUP011',
        PDALPH: 'Supplier K',
        PDRQDC: new Date(Date.now() - 63 * 24 * 60 * 60 * 1000),
        PDPDDJ: new Date(Date.now() + 77 * 24 * 60 * 60 * 1000),
        PDSTS: 'A',
        PDTOA: 16000.00,
        PDFAP: 800.00,
        PDCNDJ: 'USD',
        PDCNDC: 'USD',
        PDBUY: 'BUYER2',
        PHMCU: '00200',
        PHDCTO: 'OP',
        lineItemCount: 9
      },
      {
        PDDOCO: 'PO012',
        PDAN8: 'SUP012',
        PDALPH: 'Supplier L',
        PDRQDC: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
        PDPDDJ: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000),
        PDSTS: 'C',
        PDTOA: 13000.00,
        PDFAP: 650.00,
        PDCNDJ: 'USD',
        PDCNDC: 'USD',
        PDBUY: 'BUYER3',
        PHMCU: '00300',
        PHDCTO: 'CL',
        lineItemCount: 11
      }
    ];

    // Filter by PO number if specified
    if (poNumber) {
      return mockData.filter(po => po.PDDOCO === poNumber);
    }

    // Filter by search term
    let filteredData = mockData;
    if (search) {
      filteredData = mockData.filter(po => 
        po.PDDOCO.toLowerCase().includes(search.toLowerCase()) ||
        po.PDALPH.toLowerCase().includes(search.toLowerCase()) ||
        po.PDBUY.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by status
    if (status) {
      filteredData = filteredData.filter(po => {
        if (status === 'ACTIVE') return po.PDSTS === 'A';
        if (status === 'COMPLETED') return po.PDSTS === 'C';
        if (status === 'PENDING') return po.PDSTS === 'P';
        return true;
      });
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }

  // Get line item count for a PO
  async getLineItemCount(poNumber: string): Promise<number> {
    try {
      const connection = await this.getConnection();
      
      const query = `
        SELECT COUNT(*) as lineCount
        FROM F4311 
        WHERE PDDOCO = :poNumber
      `;
      
      const result = await connection.execute(query, [poNumber], {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      
      if (result.rows && result.rows.length > 0) {
        return parseInt((result.rows[0] as any).LINECOUNT) || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting line item count:', error);
      return 0;
    }
  }

  // Get Purchase Order Details from JDE F4311
  async getPurchaseOrderDetails(poNumber: string): Promise<JDEPurchaseOrderDetail[]> {
    try {
      const connection = await this.getConnection();
      
      // First, let's try to get the company code from the PO header
      const headerQuery = `
        SELECT PHKCOO FROM F4301 
        WHERE PHDOCO = :poNumber 
        AND ROWNUM = 1
      `;
      
      const headerResult = await connection.execute(headerQuery, [poNumber], {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      
      const companyCode = (headerResult.rows?.[0] as any)?.PHKCOO || '00001'; // Default company code
      
      // Now query F4311 with correct column names based on actual JDE structure
      let query = `
        SELECT 
          PDDOCO, PDLNID, PDITM, PDDSC1, PDUORG, PDUREC, 
          PDPRRC, PDAEXP, PDPDDJ, PDLTTR, PDNXTR, PDFRRC, PDFEA
        FROM F4311 
        WHERE PDDOCO = :poNumber 
        AND PDKCOO = :companyCode
        ORDER BY PDLNID
      `;
      
      let result = await connection.execute(query, [poNumber, companyCode], {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      
      // If no results, try without company code
      if (!result.rows || result.rows.length === 0) {
        query = `
          SELECT 
            PDDOCO, PDLNID, PDITM, PDDSC1, PDUORG, PDUREC, 
            PDPRRC, PDAEXP, PDPDDJ, PDLTTR, PDNXTR, PDFRRC, PDFEA
          FROM F4311 
          WHERE PDDOCO = :poNumber
          ORDER BY PDLNID
        `;
        
        result = await connection.execute(query, [poNumber], {
          outFormat: oracledb.OUT_FORMAT_OBJECT
        });
      }
      
      // If still no results, try with just basic columns
      if (!result.rows || result.rows.length === 0) {
        query = `
          SELECT PDDOCO, PDLNID, PDITM
          FROM F4311 
          WHERE PDDOCO = :poNumber
          ORDER BY PDLNID
        `;
        
        result = await connection.execute(query, [poNumber], {
          outFormat: oracledb.OUT_FORMAT_OBJECT
        });
      }
      
      if (!result.rows) {
        return [];
      }
      
      return result.rows.map((row: any) => ({
        PDDOCO: String(row.PDDOCO || '').trim(),
        PDLINE: (parseInt(row.PDLNID) || 0) / 1000, // Line number divided by 1000
        PDITM: String(row.PDITM || '').trim(),
        PDDSC1: String(row.PDDSC1 || `Item ${row.PDITM || 'Unknown'}`).trim(),
        PDQTOR: (parseInt(row.PDUORG) || 0) / 100, // Quantity divided by 100
        PDRQTOR: (parseInt(row.PDUREC) || 0) / 100, // Quantity received divided by 100
        PDUPRC: this.formatCurrencyAmount(parseFloat(row.PDPRRC) || 0, row.PDCRCD || 'USD'), // Format based on currency
        PDEXRC: (parseFloat(row.PDAEXP) || 0) / 100, // Extended price divided by 100
        PDFRRC: (parseFloat(row.PDFRRC) || 0) / 10000, // Foreign unit cost divided by 10000
        PDFEA: parseFloat(row.PDFEA) || 0, // Foreign extended cost (no division)
        PDPDDJ: row.PDPDDJ ? this.parseJDEDate(row.PDPDDJ) : undefined,
        PDSTS: this.getDetailStatus(row.PDLTTR || 'A'), // Current status
        PDNSTS: this.getDetailStatus(row.PDNXTR || 'A'), // Next status
        PDLSTS: this.getDetailStatus(row.PDLTTR || 'A') // Last status (same as current for now)
      }));
    } catch (error) {
      console.error('Error fetching Purchase Order Details from JDE:', error);
      // Do NOT fall back to mock data
      return [];
    }
  }

  // Helper method to map JDE line status
  private getDetailStatus(lineStatus: string): string {
    switch (lineStatus) {
      case '520': return 'A'; // Active
      case '999': return 'C'; // Closed
      case '550': return 'H'; // Hold
      default: return 'A';
    }
  }

  // Helper method to format currency amounts based on currency type
  private formatCurrencyAmount(amount: number, currency: string): number {
    const currencyCode = currency?.trim().toUpperCase() || 'USD';
    
    // VND has zero decimal places, USD has 4 decimal places
    if (currencyCode === 'VND') {
      return amount / 100; // VND: divide by 100, no decimal places
    } else {
      return amount / 10000; // USD: divide by 10000 for 4 decimal places
    }
  }

  // Get supplier information from Address Book (F0101)
  async getSupplierInfo(supplierId: string): Promise<{ name: string; address: string }> {
    try {
      const connection = await this.getConnection();
      
      const query = `
        SELECT ABALPH, ABAT1, ABAT2, ABAT3, ABAT4
        FROM F0101 
        WHERE ABAN8 = :supplierId
      `;
      
      const result = await connection.execute(query, [supplierId], {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      
      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0] as any;
        return {
          name: String(row.ABALPH || `Supplier ${supplierId}`).trim(),
          address: `${String(row.ABAT1 || '').trim()} ${String(row.ABAT2 || '').trim()} ${String(row.ABAT3 || '').trim()} ${String(row.ABAT4 || '').trim()}`.trim()
        };
      }
      
      return {
        name: `Supplier ${supplierId}`,
        address: ''
      };
    } catch (error) {
      console.error('Error fetching supplier info:', error);
      return {
        name: `Supplier ${supplierId}`,
        address: ''
      };
    }
  }

  // Mock data fallback
  private getMockPurchaseOrderDetails(poNumber: string): JDEPurchaseOrderDetail[] {
    const mockData: JDEPurchaseOrderDetail[] = [
      {
        PDDOCO: poNumber,
        PDLINE: 1, // Already in correct format (divided by 1000)
        PDITM: 'ITEM001',
        PDDSC1: 'Raw Material A',
        PDQTOR: 100,
        PDRQTOR: 0,
        PDUPRC: 25.00, // Already in correct format
        PDEXRC: 2500.00, // Already in correct format
        PDFRRC: 250.00, // Foreign unit cost (divided by 10000)
        PDFEA: 25000.00, // Foreign extended cost
        PDPDDJ: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        PDSTS: 'A',
        PDNSTS: 'A',
        PDLSTS: 'A'
      },
      {
        PDDOCO: poNumber,
        PDLINE: 2, // Already in correct format (divided by 1000)
        PDITM: 'ITEM002',
        PDDSC1: 'Component B',
        PDQTOR: 50,
        PDRQTOR: 0,
        PDUPRC: 50.00, // Already in correct format
        PDEXRC: 2500.00, // Already in correct format
        PDFRRC: 50.00, // Foreign unit cost (divided by 10000)
        PDFEA: 2500.00, // Foreign extended cost
        PDPDDJ: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        PDSTS: 'A',
        PDNSTS: 'A',
        PDLSTS: 'A'
      }
    ];

    return mockData.filter(detail => detail.PDDOCO === poNumber);
  }

  // Get MRP Messages
  async getMrpMessages(itemNumber?: string): Promise<JDEMrpMessage[]> {
    try {
      const mockData: JDEMrpMessage[] = [
        {
          MMITM: 'ITEM001',
          MMMSG: 'PURCHASE',
          MMTEXT: 'Purchase recommendation for item ITEM001',
          MMQTY: 200,
          MMDATE: new Date(),
          MMPRI: 1,
          MMSTS: 'A'
        },
        {
          MMITM: 'ITEM002',
          MMMSG: 'RELEASE',
          MMTEXT: 'Release order for item ITEM002',
          MMQTY: 100,
          MMDATE: new Date(),
          MMPRI: 2,
          MMSTS: 'A'
        }
      ];

      if (itemNumber) {
        return mockData.filter(msg => msg.MMITM === itemNumber);
      }

      return mockData;
    } catch (error) {
      console.error('Error fetching MRP Messages:', error);
      throw error;
    }
  }

  // Get real inventory levels with calculations
  async getInventoryLevels(itemNumber?: string, page: number = 1, pageSize: number = 50): Promise<JDEInventoryLevel[]> {
    try {
      const connection = await this.getConnection();
      
      let query: string;
      let bindVars: any[] = [];
      let offset = (page - 1) * pageSize;
      
      if (itemNumber) {
        // Query specific item with real inventory data from F41021
        query = `
          SELECT 
            i.IMITM,                    -- Item Number
            i.IMLITM,                   -- Item Description
            i.IMDSC1,                   -- Item Description 1
            i.IMDSC2,                   -- Item Description 2
            'P' as IMTYP,               -- Item Type (default to Product)
            COALESCE(TRIM(CAST(i.IMUOM1 AS VARCHAR2(4))), 'EA') as IMUM,  -- Primary UOM (fallback to EA)
            CAST(i.IMUOM1 AS VARCHAR2(4)) as IMUOM1,                   -- Primary UOM
            CAST(i.IMUOM3 AS VARCHAR2(4)) as IMUOM3,                   -- Purchasing UOM
            0 as IMSLD,                 -- Safety Stock (default)
            0 as IMANPL,                -- Min Order Qty (default)
            0 as IMLOTS,                -- Lot Size (default)
            '' as IMBUYR,               -- Buyer (default)
            '' as IMPDGR,               -- Product Group (default)
            '' as IMDSGP,               -- Dispatch Group (default)
            i.IMGLPT,                   -- General Ledger Posting Type
            MAX(l.LIMCU) as LIMCU,      -- Business Unit (from F41021)
            
            -- Real inventory data from F41021
            COALESCE(SUM(l.LIPQOH), 0) as TotalQOH,           -- Total Quantity On Hand
            COALESCE(SUM(l.LIPREQ), 0) as TotalQOO,           -- Total Quantity On Order
            COALESCE(SUM(l.LIHCOM), 0) + COALESCE(SUM(l.LISWSC), 0) as TotalQC,  -- Total Committed (Hard + Soft)
            COALESCE(SUM(l.LIHCOM), 0) as TotalHardCommit,    -- Total Hard Committed
            COALESCE(SUM(l.LISWSC), 0) as TotalSoftCommit,    -- Total Soft Committed
            
            -- Additional F41021 fields
            COALESCE(SUM(l.LIQTIN), 0) as TotalInTransit,     -- Total Quantity In Transit
            COALESCE(SUM(l.LIPBCK), 0) as TotalBackorder,     -- Total Quantity on Backorder
            
            -- Calculated Values
            COALESCE(SUM(l.LIPQOH), 0) - (COALESCE(SUM(l.LIHCOM), 0) + COALESCE(SUM(l.LISWSC), 0)) as AvailableStock,
            COALESCE(SUM(l.LIPQOH), 0) + COALESCE(SUM(l.LIPREQ), 0) - (COALESCE(SUM(l.LIHCOM), 0) + COALESCE(SUM(l.LISWSC), 0)) as NetStock,
            
            -- Status Logic
            CASE 
              WHEN COALESCE(SUM(l.LIPQOH), 0) - (COALESCE(SUM(l.LIHCOM), 0) + COALESCE(SUM(l.LISWSC), 0)) = 0 THEN 'OUT'
              WHEN COALESCE(SUM(l.LIPQOH), 0) - (COALESCE(SUM(l.LIHCOM), 0) + COALESCE(SUM(l.LISWSC), 0)) < 10 THEN 'LOW'
              ELSE 'OK'
            END as StockStatus
            
          FROM F4101 i
          LEFT JOIN F41021 l ON i.IMITM = l.LIITM
          WHERE i.IMITM = :itemNumber
          GROUP BY i.IMITM, i.IMLITM, i.IMDSC1, i.IMDSC2, i.IMGLPT, i.IMUOM1, i.IMUOM3
        `;
        bindVars = [itemNumber];
      } else {
        // Query all items with pagination and real inventory data
        query = `
          SELECT 
            i.IMITM,                    -- Item Number
            i.IMLITM,                   -- Item Description
            i.IMDSC1,                   -- Item Description 1
            i.IMDSC2,                   -- Item Description 2
            'P' as IMTYP,               -- Item Type (default to Product)
            COALESCE(TRIM(CAST(i.IMUOM1 AS VARCHAR2(4))), 'EA') as IMUM,  -- Primary UOM (fallback to EA)
            CAST(i.IMUOM1 AS VARCHAR2(4)) as IMUOM1,                   -- Primary UOM
            CAST(i.IMUOM3 AS VARCHAR2(4)) as IMUOM3,                   -- Purchasing UOM
            0 as IMSLD,                 -- Safety Stock (default)
            0 as IMANPL,                -- Min Order Qty (default)
            0 as IMLOTS,                -- Lot Size (default)
            '' as IMBUYR,               -- Buyer (default)
            '' as IMPDGR,               -- Product Group (default)
            '' as IMDSGP,               -- Dispatch Group (default)
            i.IMGLPT,                   -- General Ledger Posting Type
            MAX(l.LIMCU) as LIMCU,      -- Business Unit (from F41021)
            
            -- Real inventory data from F41021
            COALESCE(SUM(l.LIPQOH), 0) as TotalQOH,           -- Total Quantity On Hand
            COALESCE(SUM(l.LIPREQ), 0) as TotalQOO,           -- Total Quantity On Order
            COALESCE(SUM(l.LIHCOM), 0) + COALESCE(SUM(l.LISWSC), 0) as TotalQC,  -- Total Committed (Hard + Soft)
            COALESCE(SUM(l.LIHCOM), 0) as TotalHardCommit,    -- Total Hard Committed
            COALESCE(SUM(l.LISWSC), 0) as TotalSoftCommit,    -- Total Soft Committed
            
            -- Additional F41021 fields
            COALESCE(SUM(l.LIQTIN), 0) as TotalInTransit,     -- Total Quantity In Transit
            COALESCE(SUM(l.LIPBCK), 0) as TotalBackorder,     -- Total Quantity on Backorder
            
            -- Calculated Values
            COALESCE(SUM(l.LIPQOH), 0) - (COALESCE(SUM(l.LIHCOM), 0) + COALESCE(SUM(l.LISWSC), 0)) as AvailableStock,
            COALESCE(SUM(l.LIPQOH), 0) + COALESCE(SUM(l.LIPREQ), 0) - (COALESCE(SUM(l.LIHCOM), 0) + COALESCE(SUM(l.LISWSC), 0)) as NetStock,
            
            -- Status Logic
            CASE 
              WHEN COALESCE(SUM(l.LIPQOH), 0) - (COALESCE(SUM(l.LIHCOM), 0) + COALESCE(SUM(l.LISWSC), 0)) = 0 THEN 'OUT'
              WHEN COALESCE(SUM(l.LIPQOH), 0) - (COALESCE(SUM(l.LIHCOM), 0) + COALESCE(SUM(l.LISWSC), 0)) < 10 THEN 'LOW'
              ELSE 'OK'
            END as StockStatus
            
          FROM F4101 i
          LEFT JOIN F41021 l ON i.IMITM = l.LIITM
          GROUP BY i.IMITM, i.IMLITM, i.IMDSC1, i.IMDSC2, i.IMGLPT, i.IMUOM1, i.IMUOM3
          ORDER BY i.IMITM
          OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
        `;
        bindVars = [offset, pageSize];
      }
      
      const result = await connection.execute(query, bindVars, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      
      if (!result.rows) {
        return [];
      }
      
      return result.rows.map((row: any) => ({
        IMITM: String(row.IMITM || '').trim(),
        IMLITM: String(row.IMLITM || '').trim(),
        IMTYP: String(row.IMTYP || 'P').trim(),
        IMUM: String(row.IMUM || 'EA').trim(),
        IMUOM1: String(row.IMUOM1 || '').trim(),
        IMUOM3: String(row.IMUOM3 || '').trim(),
        IMSSQ: parseInt(row.IMSLD) || 0,
        IMMOQ: parseInt(row.IMANPL) || 0,
        IMMXQ: parseInt(row.IMLOTS) || 0,
        IMLOTS: parseInt(row.IMLOTS) || 0,
        IMCC: String(row.IMPDGR || '').trim(),
        IMPL: String(row.IMDSGP || '').trim(),
        IMBUY: String(row.IMBUYR || '').trim(),
        IMGLPT: String(row.IMGLPT || '').trim(),
        LIMCU: String(row.LIMCU || '').trim(),
        
        // Real inventory calculations from F41021
        TotalQOH: parseInt(row.TOTALQOH) || 0,
        TotalQOO: parseInt(row.TOTALQOO) || 0,
        TotalQC: parseInt(row.TOTALQC) || 0,
        TotalHardCommit: parseInt(row.TOTALHARDCOMMIT) || 0,
        TotalSoftCommit: parseInt(row.TOTALSOFTCOMMIT) || 0,
        TotalInTransit: parseInt(row.TOTALINTRANSIT) || 0,
        TotalBackorder: parseInt(row.TOTALBACKORDER) || 0,
        AvailableStock: parseInt(row.AVAILABLESTOCK) || 0,
        NetStock: parseInt(row.NETSTOCK) || 0,
        StockStatus: String(row.STOCKSTATUS || 'OK').trim()
      }));
    } catch (error) {
      console.error('Error fetching inventory levels from JDE:', error);
      // Return empty array instead of mock data for real implementation
      return [];
    }
  }

  // Get total count of inventory items for pagination
  async getInventoryCount(): Promise<number> {
    try {
      const connection = await this.getConnection();
      
      const query = `
        SELECT COUNT(DISTINCT i.IMITM) as total_count
        FROM F4101 i
        LEFT JOIN F41021 l ON i.IMITM = l.LIITM
      `;
      
      const result = await connection.execute(query, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      
      if (!result.rows || result.rows.length === 0) {
        return 0;
      }
      
      const row = result.rows[0] as any;
      return parseInt(row.TOTAL_COUNT) || 0;
    } catch (error) {
      console.error('Error fetching inventory count from JDE:', error);
      return 0;
    }
  }

  // Sync data to local database
  async syncToLocalDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      const startTime = new Date();
      
      // Sync Item Master
      const items = await this.getItemMaster();
      for (const item of items) {
        // Sync to local database
        await prisma.itemMaster.upsert({
          where: { itemNumber: item.IMITM },
          update: {
            description: item.IMLITM,
            itemType: item.IMTYP,
            unitOfMeasure: item.IMUM,
            leadTime: item.IMLT,
            safetyStock: item.IMSSQ,
            minOrderQty: item.IMMOQ,
            maxOrderQty: item.IMMXQ,
            lotSize: item.IMLOTS,
            costCenter: item.IMCC,
            planner: item.IMPL,
            buyer: item.IMBUY,
          },
          create: {
            itemNumber: item.IMITM,
            description: item.IMLITM,
            itemType: item.IMTYP,
            unitOfMeasure: item.IMUM,
            leadTime: item.IMLT,
            safetyStock: item.IMSSQ,
            minOrderQty: item.IMMOQ,
            maxOrderQty: item.IMMXQ,
            lotSize: item.IMLOTS,
            costCenter: item.IMCC,
            planner: item.IMPL,
            buyer: item.IMBUY,
          },
        });
      }

      // Log sync completion
      await prisma.dataSyncLog.create({
        data: {
          syncType: 'inventory',
          status: 'success',
          recordsProcessed: items.length,
          recordsFailed: 0,
          startTime: new Date(),
          endTime: new Date(),
        },
      });

      return { success: true, message: `Successfully synced ${items.length} items` };
    } catch (error) {
      console.error('Error syncing item master data:', error);
      
      // Log sync failure
      await prisma.dataSyncLog.create({
        data: {
          syncType: 'inventory',
          status: 'failed',
          recordsProcessed: 0,
          recordsFailed: 0,
          startTime: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.close();
        this.connection = null;
      } catch (error) {
        console.error('Error closing JDE connection:', error);
      }
    }
  }
}

// Factory function to create JDE service
export function createJDEService(): JDEService {
  const config: JDEConfig = {
    dbHost: process.env.JDE_DB_HOST || 'localhost',
    dbPort: parseInt(process.env.JDE_DB_PORT || '1521'),
    dbService: process.env.JDE_DB_SERVICE || 'JDE',
    dbUser: process.env.JDE_DB_USER || 'jde_user',
    dbPassword: process.env.JDE_DB_PASSWORD || 'jde_password',
    aisServer: process.env.JDE_AIS_SERVER || 'localhost',
    aisPort: parseInt(process.env.JDE_AIS_PORT || '9999'),
    aisUser: process.env.JDE_AIS_USER || 'ais_user',
    aisPassword: process.env.JDE_AIS_PASSWORD || 'ais_password',
    environment: (process.env.NODE_ENV as 'development' | 'production') || 'development'
  };

  return new JDEService(config);
} 