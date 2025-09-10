import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/legal-review-requests - Get all legal review requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has legal department access
    const isLegalUser = session.user.department?.toUpperCase() === 'LEGAL' ||
                       session.user.role === 'ADMIN' ||
                       ['GENERAL_DIRECTOR', 'GENERAL DIRECTOR', 'VICE_GENERAL_DIRECTOR', 'VICE GENERAL DIRECTOR', 'CHIEF_SPECIALIST', 'MANAGER', 'SENIOR_MANAGER', 'DIRECTOR'].includes(session.user.role?.toUpperCase() || '');

    if (!isLegalUser) {
      return NextResponse.json({ 
        error: 'Access denied. Only legal department members can view legal review requests.' 
      }, { status: 403 });
    }

    // Get all legal review requests with related data
    const legalReviewRequests = await prisma.legalReviewRequest.findMany({
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            contractTitle: true,
            contractStatus: true,
            counterparty: true,
            value: true,
            currency: true,
            createdAt: true,
            project: {
              select: {
                id: true,
                name: true,
                ownerId: true
              }
            }
          }
        },
        requestedByUser: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true
          }
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      legalReviewRequests
    });

  } catch (error) {
    console.error('Error fetching legal review requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal review requests' },
      { status: 500 }
    );
  }
}
