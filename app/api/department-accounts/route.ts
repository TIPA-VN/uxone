import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bu = searchParams.get('bu');
    const department = searchParams.get('department');
    const account = searchParams.get('account');
    const approvalRoute = searchParams.get('approvalRoute');

    // Build where clause based on query parameters
    const where: any = {};
    
    if (bu) {
      where.bu = bu;
    }
    
    if (department) {
      where.department = {
        contains: department,
        mode: 'insensitive'
      };
    }
    
    if (account) {
      where.account = parseInt(account);
    }

    if (approvalRoute) {
      where.approvalRoute = approvalRoute;
    }

    const departmentAccounts = await prisma.departmentAccount.findMany({
      where,
      orderBy: [
        { bu: 'asc' },
        { department: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        departmentAccounts,
        total: departmentAccounts.length
      }
    });
  } catch (error) {
    console.error('Error fetching department accounts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch department accounts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bu, department, account, approvalRoute } = body;

    // Validate required fields
    if (!bu || !department || !account) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: bu, department, account'
        },
        { status: 400 }
      );
    }

    // Validate account is a number
    if (isNaN(account) || !Number.isInteger(account)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account must be a valid integer'
        },
        { status: 400 }
      );
    }

    const departmentAccount = await prisma.departmentAccount.create({
      data: {
        bu,
        department,
        account: parseInt(account),
        approvalRoute
      }
    });

    return NextResponse.json({
      success: true,
      data: departmentAccount
    });
  } catch (error) {
    console.error('Error creating department account:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Department account already exists for this BU and department/account combination'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create department account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 