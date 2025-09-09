import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/contracts/[id]/legal-review - Start legal review process
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, comment } = body;

    // Get current user for role checking
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is in legal department or has appropriate role
    const isLegalUser = currentUser.department?.toUpperCase() === 'LEGAL' ||
                       currentUser.role === 'ADMIN' ||
                       ['GENERAL_DIRECTOR', 'GENERAL DIRECTOR', 'VICE_GENERAL_DIRECTOR', 'VICE GENERAL DIRECTOR'].includes(currentUser.role?.toUpperCase() || '');

    if (!isLegalUser) {
      return NextResponse.json({ 
        error: 'Access denied. Only legal department members can perform legal review.' 
      }, { status: 403 });
    }

    // Get contract details
    const contract = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true
          }
        },
        document: true
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (!contract.documentId) {
      return NextResponse.json(
        { error: 'Contract has no associated document' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'START_REVIEW':
        // Move contract to REVIEW status and enable commenting
        const updatedContract = await prisma.contractDetails.update({
          where: { id },
          data: {
            contractStatus: 'REVIEW',
            currentApproverId: session.user.id,
            updatedAt: new Date()
          }
        });

        // Create a system comment indicating legal review has started
        if (comment) {
          await prisma.documentComment.create({
            data: {
              documentId: contract.documentId,
              contractId: id,
              content: `Legal review started: ${comment}`,
              authorId: session.user.id,
              category: 'LEGAL',
              priority: 'HIGH',
              status: 'ACTIVE'
            }
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Legal review process started',
          contract: updatedContract
        });

      case 'COMPLETE_REVIEW':
        // Check if all legal comments are resolved
        const unresolvedComments = await prisma.documentComment.count({
          where: {
            contractId: id,
            category: 'LEGAL',
            isResolved: false,
            status: 'ACTIVE'
          }
        });

        if (unresolvedComments > 0) {
          return NextResponse.json({
            error: `Cannot complete review. ${unresolvedComments} legal comments are still unresolved.`,
            unresolvedComments
          }, { status: 400 });
        }

        // Move contract to next approval level or approved
        const nextLevel = contract.currentApprovalLevel + 1;
        const isLastLevel = nextLevel > contract.totalApprovalLevels;

        const finalContract = await prisma.contractDetails.update({
          where: { id },
          data: {
            contractStatus: isLastLevel ? 'APPROVED' : 'DRAFT',
            currentApprovalLevel: isLastLevel ? contract.currentApprovalLevel : nextLevel,
            currentApproverId: null,
            updatedAt: new Date()
          }
        });

        // Create a system comment indicating legal review is complete
        await prisma.documentComment.create({
          data: {
            documentId: contract.documentId,
            contractId: id,
            content: `Legal review completed${comment ? `: ${comment}` : ''}`,
            authorId: session.user.id,
            category: 'LEGAL',
            priority: 'NORMAL',
            status: 'ACTIVE'
          }
        });

        return NextResponse.json({
          success: true,
          message: isLastLevel ? 'Legal review completed. Contract is now approved.' : 'Legal review completed. Contract moved to next approval level.',
          contract: finalContract
        });

      case 'REQUEST_CHANGES':
        // Move contract back to DRAFT and notify original author
        const draftContract = await prisma.contractDetails.update({
          where: { id },
          data: {
            contractStatus: 'DRAFT',
            currentApprovalLevel: 1, // Reset to first level
            currentApproverId: contract.project?.ownerId || null,
            updatedAt: new Date()
          }
        });

        // Create a high-priority comment with change requests
        if (comment) {
          await prisma.documentComment.create({
            data: {
              documentId: contract.documentId,
              contractId: id,
              content: `Legal review - Changes requested: ${comment}`,
              authorId: session.user.id,
              category: 'LEGAL',
              priority: 'URGENT',
              status: 'ACTIVE'
            }
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Contract returned for changes. Legal department has requested modifications.',
          contract: draftContract
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Supported actions: START_REVIEW, COMPLETE_REVIEW, REQUEST_CHANGES'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in legal review process:', error);
    return NextResponse.json(
      { error: 'Failed to process legal review action' },
      { status: 500 }
    );
  }
}

// GET /api/contracts/[id]/legal-review - Get legal review status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get contract details
    const contract = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true
          }
        },
        document: true
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get legal comments count
    const legalComments = await prisma.documentComment.findMany({
      where: {
        contractId: id,
        category: 'LEGAL',
        status: 'ACTIVE'
      },
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
      orderBy: { createdAt: 'desc' }
    });

    const unresolvedCount = legalComments.filter(comment => !comment.isResolved).length;
    const resolvedCount = legalComments.filter(comment => comment.isResolved).length;

    return NextResponse.json({
      success: true,
      reviewStatus: {
        contractStatus: contract.contractStatus,
        currentApprovalLevel: contract.currentApprovalLevel,
        totalApprovalLevels: contract.totalApprovalLevels,
        isInReview: contract.contractStatus === 'REVIEW',
        legalComments: {
          total: legalComments.length,
          resolved: resolvedCount,
          unresolved: unresolvedCount
        },
        comments: legalComments
      }
    });

  } catch (error) {
    console.error('Error fetching legal review status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal review status' },
      { status: 500 }
    );
  }
}
