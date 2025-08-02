import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  transformDemandToERP, 
  validateERPData, 
  createERPPurchaseOrder,
  generateERPTransformationSummary,
  type ERPPurchaseOrderData 
} from '@/lib/erp-data-transformer';
import { demandCreationSchema } from '@/lib/zod';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { demandId, supplierCode, p4310Version, customMappings } = body;

    // Validate required fields
    if (!demandId) {
      return NextResponse.json(
        { error: 'Demand ID is required' },
        { status: 400 }
      );
    }

    // Fetch the demand with its lines from the database
    const demand = await prisma.demand.findUnique({
      where: { id: demandId },
      include: {
        demandLines: {
          orderBy: { createdAt: 'asc' }
        },
        user: {
          select: {
            id: true,
            name: true,
            department: true,
            centralDepartment: true
          }
        }
      }
    });

    if (!demand) {
      return NextResponse.json(
        { error: 'Demand not found' },
        { status: 404 }
      );
    }

    // Transform demand data to match our schema format
    const demandData = {
      bu: demand.bu,
      department: demand.department,
      account: demand.account,
      approvalRoute: demand.approvalRoute,
      expenseAccount: demand.expenseAccount,
      expenseDescription: demand.expenseDescription,
      expenseGLClass: demand.expenseGLClass,
      expenseStockType: demand.expenseStockType,
      expenseOrderType: demand.expenseOrderType,
      demandLines: demand.demandLines.map(line => ({
        itemDescription: line.itemDescription,
        quantity: line.quantity,
        estimatedCost: line.estimatedCost,
        unitOfMeasure: line.unitOfMeasure || 'EA',
        specifications: line.specifications || '',
        supplierPreference: line.supplierPreference || ''
      })),
      justification: demand.justification,
      priorityLevel: demand.priorityLevel,
      expectedDeliveryDate: demand.expectedDeliveryDate,
      departmentSpecific: demand.departmentSpecific,
      attachments: demand.attachments
    };

    // Create ERP purchase order data
    const erpData = createERPPurchaseOrder(demandData, {
      supplierCode: supplierCode || "1001411",
      p4310Version: p4310Version || "TIPA0031",
      customMappings
    });

    // Validate ERP data
    const validation = validateERPData(erpData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'ERP data validation failed',
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Generate transformation summary
    const summary = generateERPTransformationSummary(demandData, erpData);

    // TODO: Call actual ERP API here
    // For now, we'll simulate the API call
    const erpResponse = await simulateERPAPICall(erpData);

    // Update demand status to indicate ERP integration
    await prisma.demand.update({
      where: { id: demandId },
      data: {
        status: 'ERP_PROCESSING',
        departmentSpecific: {
          ...demand.departmentSpecific,
          erpIntegration: {
            timestamp: new Date().toISOString(),
            erpData: erpData,
            summary: summary,
            response: erpResponse
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Demand successfully integrated with ERP system',
      data: {
        demandId,
        erpData,
        summary,
        erpResponse
      }
    });

  } catch (error) {
    console.error('ERP Integration error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to integrate with ERP system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Simulate ERP API call - replace with actual ERP API integration
 */
async function simulateERPAPICall(erpData: ERPPurchaseOrderData): Promise<any> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate successful response
  return {
    success: true,
    poNumber: `PO-${Date.now()}`,
    message: 'Purchase order created successfully in ERP system',
    timestamp: new Date().toISOString(),
    erpData: erpData
  };
}

/**
 * GET endpoint to preview ERP data transformation
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const demandId = searchParams.get('demandId');
    const supplierCode = searchParams.get('supplierCode') || "1001411";
    const p4310Version = searchParams.get('p4310Version') || "TIPA0031";

    if (!demandId) {
      return NextResponse.json(
        { error: 'Demand ID is required' },
        { status: 400 }
      );
    }

    // Fetch the demand with its lines
    const demand = await prisma.demand.findUnique({
      where: { id: demandId },
      include: {
        demandLines: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!demand) {
      return NextResponse.json(
        { error: 'Demand not found' },
        { status: 404 }
      );
    }

    // Transform demand data
    const demandData = {
      bu: demand.bu,
      department: demand.department,
      account: demand.account,
      approvalRoute: demand.approvalRoute,
      expenseAccount: demand.expenseAccount,
      expenseDescription: demand.expenseDescription,
      expenseGLClass: demand.expenseGLClass,
      expenseStockType: demand.expenseStockType,
      expenseOrderType: demand.expenseOrderType,
      demandLines: demand.demandLines.map(line => ({
        itemDescription: line.itemDescription,
        quantity: line.quantity,
        estimatedCost: line.estimatedCost,
        unitOfMeasure: line.unitOfMeasure || 'EA',
        specifications: line.specifications || '',
        supplierPreference: line.supplierPreference || ''
      })),
      justification: demand.justification,
      priorityLevel: demand.priorityLevel,
      expectedDeliveryDate: demand.expectedDeliveryDate,
      departmentSpecific: demand.departmentSpecific,
      attachments: demand.attachments
    };

    // Create ERP purchase order data
    const erpData = createERPPurchaseOrder(demandData, {
      supplierCode,
      p4310Version
    });

    // Validate ERP data
    const validation = validateERPData(erpData);
    const summary = generateERPTransformationSummary(demandData, erpData);

    return NextResponse.json({
      success: true,
      data: {
        demandId,
        erpData,
        summary,
        validation: {
          isValid: validation.isValid,
          errors: validation.errors
        }
      }
    });

  } catch (error) {
    console.error('ERP Preview error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to preview ERP data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 