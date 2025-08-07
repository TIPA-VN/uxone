import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessName = searchParams.get('businessName');
    const orderType = searchParams.get('orderType');

    // Build where clause
    const where: any = {};
    
    if (businessName) {
      where.businessName = businessName;
    }
    
    if (orderType) {
      where.orderType = orderType;
    }

    // Fetch expense accounts
    const expenseAccounts = await prisma.expenseAccount.findMany({
      where,
      select: {
        account: true,
        description: true,
        glClass: true,
        stockType: true,
        orderType: true,
        businessName: true,
        bu: true,
      },
      orderBy: [
        { description: 'asc' },
        { account: 'asc' },
        { orderType: 'asc' }
      ],
    });

    return NextResponse.json({
      success: true,
      data: {
        expenseAccounts,
        count: expenseAccounts.length
      }
    });

  } catch (error) {
    console.error('Error fetching expense accounts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expense accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, description, glClass, businessName, orderType, bu, stockType } = body;

    // Validate required fields
    if (!account || !description || !glClass || !businessName || !orderType || !bu || !stockType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: account, description, glClass, businessName, orderType, bu, stockType'
        },
        { status: 400 }
      );
    }

    // Validate account and bu are numbers
    if (isNaN(account) || !Number.isInteger(account)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account must be a valid integer'
        },
        { status: 400 }
      );
    }

    if (isNaN(bu) || !Number.isInteger(bu)) {
      return NextResponse.json(
        {
          success: false,
          error: 'BU must be a valid integer'
        },
        { status: 400 }
      );
    }

    const expenseAccount = await prisma.expenseAccount.create({
      data: {
        account: parseInt(account),
        description,
        glClass,
        businessName,
        orderType,
        bu: parseInt(bu),
        stockType
      }
    });

    return NextResponse.json({
      success: true,
      data: expenseAccount
    });
  } catch (error) {
    console.error('Error creating expense account:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expense account already exists for this combination of account, businessName, orderType, and bu'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create expense account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 