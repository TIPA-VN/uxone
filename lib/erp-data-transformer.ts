import { DemandCreationInput, DemandLineInput } from '@/lib/zod';

// ERP API Data Structure Types
export interface ERPPurchaseOrderData {
  Supplier_code: string;
  Requested: string; // MM/DD/YYYY format
  GridIn_1_3: ERPPurchaseOrderLine[];
  P4310_Version: string;
}

export interface ERPPurchaseOrderLine {
  Item_Number: string;
  Quantity_Ordered: string;
  Tr_UoM: string; // Transaction Unit of Measure
  G_L_Offset: string; // General Ledger Offset Account
  Cost_Center: string;
  Obj_Acct: string; // Object Account
}

// Mapping configuration for different expense accounts to ERP fields
interface ExpenseAccountMapping {
  glClass: string;
  costCenter: string;
  objectAccount: string;
  glOffset: string;
}

// Expense Account to ERP Field Mappings
const EXPENSE_ACCOUNT_MAPPINGS: Record<number, ExpenseAccountMapping> = {
  // Example mappings - these should be configured based on your ERP system
  64173: {
    glClass: "NS26",
    costCenter: "1320",
    objectAccount: "64173",
    glOffset: "NS26"
  },
  64174: {
    glClass: "NS26", 
    costCenter: "1310",
    objectAccount: "64174",
    glOffset: "NS26"
  },
  // Add more mappings as needed
};

// Default mapping for unknown expense accounts
const DEFAULT_MAPPING: ExpenseAccountMapping = {
  glClass: "NS26",
  costCenter: "1300",
  objectAccount: "64170",
  glOffset: "NS26"
};

/**
 * Transform local demand data to ERP purchase order format
 */
export function transformDemandToERP(
  demandData: DemandCreationInput,
  supplierCode: string = "1001411", // Default supplier code
  p4310Version: string = "TIPA0031" // Default version
): ERPPurchaseOrderData {
  
  // Format the requested date to MM/DD/YYYY
  const requestedDate = formatDateForERP(demandData.expectedDeliveryDate);
  
  // Transform demand lines to ERP format
  const erpLines: ERPPurchaseOrderLine[] = demandData.demandLines.map((line, index) => {
    const mapping = getExpenseAccountMapping(demandData.expenseAccount);
    
    return {
      Item_Number: line.itemDescription || `MUA-DICH-VU-${index + 1}`,
      Quantity_Ordered: line.quantity.toString(),
      Tr_UoM: mapUnitOfMeasure(line.unitOfMeasure),
      G_L_Offset: mapping.glOffset,
      Cost_Center: mapping.costCenter,
      Obj_Acct: mapping.objectAccount
    };
  });

  return {
    Supplier_code: supplierCode,
    Requested: requestedDate,
    GridIn_1_3: erpLines,
    P4310_Version: p4310Version
  };
}

/**
 * Get expense account mapping for ERP fields
 */
function getExpenseAccountMapping(expenseAccount: number): ExpenseAccountMapping {
  return EXPENSE_ACCOUNT_MAPPINGS[expenseAccount] || DEFAULT_MAPPING;
}

/**
 * Format date to MM/DD/YYYY for ERP system
 */
function formatDateForERP(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Map local unit of measure to ERP unit of measure
 */
function mapUnitOfMeasure(uom: string | undefined): string {
  const uomMapping: Record<string, string> = {
    'EA': 'EA',    // Each
    'KG': 'KG',    // Kilogram
    'L': 'L',      // Liter
    'M': 'M',      // Meter
    'PCS': 'PCS',  // Pieces
    'BOX': 'BOX',  // Box
    'SET': 'SET',  // Set
    'PACK': 'PACK', // Pack
    'TON': 'TON',  // Ton
    'GAL': 'GAL',  // Gallon
    'FT': 'FT',    // Foot
    'LB': 'LB'     // Pound
  };
  
  return uomMapping[uom || 'EA'] || 'EA';
}

/**
 * Validate ERP data before sending to API
 */
export function validateERPData(erpData: ERPPurchaseOrderData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate supplier code
  if (!erpData.Supplier_code || erpData.Supplier_code.trim() === '') {
    errors.push('Supplier_code is required');
  }
  
  // Validate requested date
  if (!erpData.Requested || !/^\d{2}\/\d{2}\/\d{4}$/.test(erpData.Requested)) {
    errors.push('Requested date must be in MM/DD/YYYY format');
  }
  
  // Validate grid lines
  if (!erpData.GridIn_1_3 || erpData.GridIn_1_3.length === 0) {
    errors.push('At least one purchase order line is required');
  } else {
    erpData.GridIn_1_3.forEach((line, index) => {
      if (!line.Item_Number || line.Item_Number.trim() === '') {
        errors.push(`Line ${index + 1}: Item_Number is required`);
      }
      if (!line.Quantity_Ordered || parseInt(line.Quantity_Ordered) <= 0) {
        errors.push(`Line ${index + 1}: Quantity_Ordered must be greater than 0`);
      }
      if (!line.Tr_UoM || line.Tr_UoM.trim() === '') {
        errors.push(`Line ${index + 1}: Tr_UoM is required`);
      }
      if (!line.G_L_Offset || line.G_L_Offset.trim() === '') {
        errors.push(`Line ${index + 1}: G_L_Offset is required`);
      }
      if (!line.Cost_Center || line.Cost_Center.trim() === '') {
        errors.push(`Line ${index + 1}: Cost_Center is required`);
      }
      if (!line.Obj_Acct || line.Obj_Acct.trim() === '') {
        errors.push(`Line ${index + 1}: Obj_Acct is required`);
      }
    });
  }
  
  // Validate version
  if (!erpData.P4310_Version || erpData.P4310_Version.trim() === '') {
    errors.push('P4310_Version is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create ERP purchase order with enhanced mapping logic
 */
export function createERPPurchaseOrder(
  demandData: DemandCreationInput,
  options: {
    supplierCode?: string;
    p4310Version?: string;
    customMappings?: Record<number, ExpenseAccountMapping>;
  } = {}
): ERPPurchaseOrderData {
  
  // Apply custom mappings if provided
  if (options.customMappings) {
    Object.assign(EXPENSE_ACCOUNT_MAPPINGS, options.customMappings);
  }
  
  return transformDemandToERP(
    demandData,
    options.supplierCode,
    options.p4310Version
  );
}

/**
 * Generate a summary of the ERP transformation
 */
export function generateERPTransformationSummary(
  demandData: DemandCreationInput,
  erpData: ERPPurchaseOrderData
): {
  totalLines: number;
  totalQuantity: number;
  totalEstimatedCost: number;
  supplierCode: string;
  requestedDate: string;
  version: string;
} {
  const totalQuantity = erpData.GridIn_1_3.reduce((sum, line) => sum + parseInt(line.Quantity_Ordered), 0);
  const totalEstimatedCost = demandData.demandLines.reduce((sum, line) => sum + (line.estimatedCost || 0), 0);
  
  return {
    totalLines: erpData.GridIn_1_3.length,
    totalQuantity,
    totalEstimatedCost,
    supplierCode: erpData.Supplier_code,
    requestedDate: erpData.Requested,
    version: erpData.P4310_Version
  };
} 