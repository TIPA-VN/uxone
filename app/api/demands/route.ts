import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { demandCreationSchema } from '@/lib/zod';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = demandCreationSchema.parse(body);

    // Create demand record
    const demand = await prisma.demand.create({
      data: {
        bu: validatedData.bu,
        department: validatedData.department,
        account: validatedData.account,
        approvalRoute: validatedData.approvalRoute,
        expenseAccount: validatedData.expenseAccount,
        expenseDescription: validatedData.expenseDescription,
        expenseGLClass: validatedData.expenseGLClass,
        expenseStockType: validatedData.expenseStockType,
        expenseOrderType: validatedData.expenseOrderType,
        itemDescription: validatedData.itemDescription,
        quantity: validatedData.quantity,
        estimatedCost: validatedData.estimatedCost,
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

    return NextResponse.json({
      success: true,
      data: demand,
      message: 'Demand created successfully'
    });

  } catch (error) {
    console.error('Error creating demand:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create demand',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priorityLevel = priority;
    }

    // For non-admin users, only show their own demands
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id;
    }

    // Get demands with pagination
    const [demands, total] = await Promise.all([
      prisma.demand.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              username: true,
              department: true,
              centralDepartment: true,
            }
          }
        }
      }),
      prisma.demand.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        demands,
        pagination: {
          currentPage: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching demands:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch demands',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 