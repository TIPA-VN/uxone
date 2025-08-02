import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { demandCreationSchema } from '@/lib/zod';
import { generateDemandId } from '@/lib/demand-id-generator';

export async function POST(request: NextRequest) {
  try {
    console.log("=== DEMANDS API POST REQUEST DEBUG ===");
    console.log("Request method:", request.method);
    console.log("Request URL:", request.url);
    
    const session = await auth();
    console.log("Session user:", session?.user?.id);
    console.log("Session user department:", session?.user?.department);
    console.log("Session user type:", typeof session?.user?.id);
    console.log("Session user length:", session?.user?.id?.length);
    
    if (!session?.user) {
      console.log("No session found - returning 401");
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("=== REQUEST BODY DEBUG ===");
    console.log("Raw request body:", body);
    console.log("Body type:", typeof body);
    console.log("Demand lines count:", body.demandLines?.length);
    console.log("Demand lines:", body.demandLines);
    console.log("=============================");

    // Validate the request body
    console.log("=== VALIDATION DEBUG ===");
    console.log("Validating request body with schema...");
    const validatedData = demandCreationSchema.parse(body);
    console.log("Validation successful!");
    console.log("Validated data:", validatedData);
    console.log("Validated demand lines count:", validatedData.demandLines?.length);
    console.log("Expected delivery date type:", typeof validatedData.expectedDeliveryDate);
    console.log("Expected delivery date value:", validatedData.expectedDeliveryDate);
    console.log("=========================");

    // Create demand record with demand lines in a transaction
    console.log("=== DATABASE TRANSACTION DEBUG ===");
    console.log("Starting database transaction...");
    
    const result = await prisma.$transaction(async (tx) => {
      console.log("Creating main demand record...");
      console.log("User ID to use:", session.user.id);
      
      // Check if user exists first
      const userExists = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, username: true }
      });
      console.log("User exists check:", userExists);
      
      // If user doesn't exist and it's a test account, create it
      if (!userExists && session.user.id.startsWith('test-account-')) {
        console.log("Creating test user in database...");
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
        console.log("Test user created:", testUser);
      } else if (!userExists) {
        throw new Error(`User with ID ${session.user.id} does not exist in the database`);
      }
      
      // Generate the demand ID
      const demandId = await generateDemandId();
      console.log("Generated demand ID:", demandId);
      
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
      
      console.log("Main demand created with ID:", demand.id);

      // Create demand lines
      console.log("Creating demand lines...");
      const demandLines = await Promise.all(
        validatedData.demandLines.map((line, index) => {
          console.log(`Creating demand line ${index + 1}:`, line);
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
      
      console.log("Demand lines created:", demandLines.length);
      console.log("Demand lines details:", demandLines);

      return { demand, demandLines };
    });

    console.log("=== TRANSACTION COMPLETED ===");
    console.log("Transaction result:", {
      demandId: result.demand.id,
      demandLinesCount: result.demandLines.length,
      totalCost: result.demandLines.reduce((sum, line) => sum + line.estimatedCost, 0)
    });
    console.log("=============================");

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Demand created successfully with multiple lines'
    });

  } catch (error) {
    console.error("=== DEMANDS API ERROR DEBUG ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Full error object:", error);
    console.error("===============================");
    
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
    console.log("=== DEMANDS API GET REQUEST DEBUG ===");
    console.log("Request method:", request.method);
    console.log("Request URL:", request.url);
    
    const session = await auth();
    console.log("Session user:", session?.user?.id);
    
    if (!session?.user) {
      console.log("No session found - returning 401");
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

    console.log("=== GET PARAMETERS DEBUG ===");
    console.log("Page:", page);
    console.log("Page size:", pageSize);
    console.log("Status filter:", status);
    console.log("Department filter:", department);
    console.log("User ID filter:", userId);
    console.log("=============================");

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

    console.log("Where clause:", whereClause);

    // Get demands with pagination and include demand lines
    console.log("=== DATABASE QUERY DEBUG ===");
    console.log("Querying demands with filters...");
    
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

    console.log("Query results:");
    console.log("Total demands found:", total);
    console.log("Demands returned:", demands.length);
    console.log("Demands with lines:", demands.filter(d => d.demandLines.length > 0).length);
    console.log("===========================");

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
    console.error("=== DEMANDS API GET ERROR DEBUG ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Full error object:", error);
    console.error("===================================");
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch demands',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 