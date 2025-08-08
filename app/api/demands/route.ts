import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { demandCreationSchema } from '@/lib/zod';
import { generateDemandId } from '@/lib/demand-id-generator';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validatedData = demandCreationSchema.parse(body);

    // Create demand record with demand lines in a transaction
    
          const result = await prisma.$transaction(async (tx) => {
        // Check if user exists first
        const userExists = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, username: true }
        });
        
        // If user doesn't exist and it's a test account, create it
        if (!userExists && session.user.id.startsWith('test-account-')) {
          const testUser = await tx.user.create({
            data: {
              id: session.user.id,
              username: session.user.username || session.user.id,
              name: session.user.name || 'Test User',
              email: session.user.email || `${session.user.username}@test.com`,
              department: session.user.department || 'TEST',
              role: session.user.role || 'STAFF',
              isActive: true,
            }
          });
        } else if (!userExists) {
          throw new Error(`User with ID ${session.user.id} does not exist in the database`);
        }
        
        // Generate the demand ID
        const demandId = await generateDemandId();
        
        // Create the main demand record
        const demand = await tx.demand.create({
          data: {
            id: demandId,
            bu: validatedData.bu,
            department: validatedData.department,
            account: validatedData.account,
            approvalRoute: validatedData.approvalRoute,
            expenseAccount: validatedData.expenseAccount,
            expenseDescription: validatedData.expenseDescription,
            expenseGLClass: validatedData.expenseGLClass,
            expenseStockType: validatedData.expenseStockType,
            expenseOrderType: validatedData.expenseOrderType,
            justification: validatedData.justification,
            priorityLevel: validatedData.priorityLevel,
            expectedDeliveryDate: validatedData.expectedDeliveryDate,
            departmentSpecific: validatedData.departmentSpecific || {},
            attachments: validatedData.attachments || [],
            userId: session.user.id,
            userDepartment: session.user.department || session.user.centralDepartment,
            status: 'PENDING',
            submittedAt: new Date(),
          },
        });

        // Create demand lines
        const demandLines = await Promise.all(
          validatedData.demandLines.map((line) => {
            return tx.demandLine.create({
              data: {
                demandId: demand.id,
                itemDescription: line.itemDescription,
                quantity: line.quantity,
                estimatedCost: line.estimatedCost,
                unitOfMeasure: line.unitOfMeasure,
                specifications: line.specifications,
                supplierPreference: line.supplierPreference,
                status: 'PENDING',
              },
            });
          })
        );

        return { demand, demandLines };
      });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Demand created successfully with multiple lines'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to create demand',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const userId = searchParams.get('userId');

    // Build where clause
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (department) {
      whereClause.department = department;
    }
    
    if (userId) {
      whereClause.userId = userId;
    }

    // Get demands with pagination and include demand lines
    const [demands, total] = await Promise.all([
      prisma.demand.findMany({
        where: whereClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              department: true,
              centralDepartment: true,
            }
          },
          demandLines: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }),
      prisma.demand.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        demands,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasNextPage: page < Math.ceil(total / pageSize),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch demands',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 