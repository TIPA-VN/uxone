import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Get comprehensive contract status
    const contractDetails = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: true,
        currentApprover: true,
        approvalHistory: {
          include: {
            approver: true
          },
          orderBy: { createdAt: 'desc' }
        },
        document: true
      }
    });

    if (!contractDetails) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if finalized document exists
    const finalizedDocument = await prisma.finalizedDocument.findFirst({
      where: {
        OR: [
          { originalDocumentId: contractDetails.documentId },
          { contractNumber: contractDetails.contractNumber }
        ]
      }
    });

    // Get approval count
    const approvalCount = contractDetails.approvalHistory.filter(
      approval => approval.status === 'APPROVED'
    ).length;

    const status = {
      contractDetails,
      approvalCount,
      hasFinalizedDocument: !!finalizedDocument,
      finalizedDocument: finalizedDocument || null,
      isReadyForFinalization: 
        contractDetails.currentApprovalLevel > contractDetails.totalApprovalLevels ||
        approvalCount >= contractDetails.totalApprovalLevels,
      debug: {
        currentLevel: contractDetails.currentApprovalLevel,
        totalLevels: contractDetails.totalApprovalLevels,
        hasDocument: !!contractDetails.documentId,
        documentId: contractDetails.documentId
      }
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking contract status:', error);
    return NextResponse.json(
      { error: 'Failed to check contract status' },
      { status: 500 }
    );
  }
}
