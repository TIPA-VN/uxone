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

    // Get contract details with all related data
    const contractDetails = await prisma.contractDetails.findUnique({
      where: { id },
      include: { 
        project: true, 
        currentApprover: true,
        approvalHistory: {
          include: { approver: true },
          orderBy: { createdAt: 'desc' }
        },
        document: true
      }
    });

    if (!contractDetails) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get all finalized documents
    const finalizedDocuments = await prisma.finalizedDocument.findMany({
      where: { 
        OR: [
          { originalDocumentId: contractDetails.documentId },
          { contractNumber: contractDetails.contractNumber }
        ]
      }
    });

    // Get all contract revisions
    const contractRevisions = await prisma.contractRevision.findMany({
      where: { contractId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      contract: {
        id: contractDetails.id,
        contractNumber: contractDetails.contractNumber,
        contractStatus: contractDetails.contractStatus,
        currentApprovalLevel: contractDetails.currentApprovalLevel,
        totalApprovalLevels: contractDetails.totalApprovalLevels,
        currentApproverId: contractDetails.currentApproverId,
        hasDocument: !!contractDetails.documentId,
        documentId: contractDetails.documentId,
        createdAt: contractDetails.createdAt,
        updatedAt: contractDetails.updatedAt
      },
      approvalHistory: contractDetails.approvalHistory.map(approval => ({
        id: approval.id,
        level: approval.level,
        status: approval.status,
        comments: approval.comments,
        approver: approval.approver.name || approval.approver.username,
        approvedAt: approval.approvedAt,
        createdAt: approval.createdAt
      })),
      contractRevisions: contractRevisions.map(revision => ({
        id: revision.id,
        version: revision.version,
        revisionNumber: revision.revisionNumber,
        action: revision.changes?.action,
        previousStatus: revision.changes?.previousStatus,
        newStatus: revision.changes?.newStatus,
        comment: revision.changes?.comment,
        performedBy: revision.changes?.performedBy,
        timestamp: revision.changes?.timestamp,
        createdAt: revision.createdAt
      })),
      finalizedDocuments: finalizedDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        contractNumber: doc.contractNumber,
        approvedAt: doc.approvedAt,
        approvedBy: doc.approvedBy,
        hasPdf: !!doc.finalizedPdf,
        hasSignature: !!doc.digitalSignature,
        checksum: doc.checksum
      })),
      debug: {
        approvalProgress: `${contractDetails.currentApprovalLevel}/${contractDetails.totalApprovalLevels}`,
        isReadyForFinalization: contractDetails.currentApprovalLevel >= contractDetails.totalApprovalLevels,
        approvalCount: contractDetails.approvalHistory.length,
        revisionCount: contractRevisions.length,
        finalizedCount: finalizedDocuments.length,
        currentWorkflowState: {
          canApprove: contractDetails.contractStatus === 'REVIEW',
          canSign: contractDetails.contractStatus === 'APPROVED',
          canExecute: contractDetails.contractStatus === 'SIGNED',
          canComplete: contractDetails.contractStatus === 'EXECUTING'
        }
      }
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
}

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
    const { action } = await request.json();

    if (action === 'RESET_APPROVAL') {
      // Reset contract to REVIEW status with level 1
      const updatedContract = await prisma.contractDetails.update({
        where: { id },
        data: {
          contractStatus: 'REVIEW',
          currentApprovalLevel: 1,
          updatedAt: new Date()
        }
      });

      // Clear approval history for testing
      await prisma.contractApproval.deleteMany({
        where: { contractId: id }
      });

      return NextResponse.json({
        success: true,
        message: 'Contract reset to approval level 1',
        contract: updatedContract
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in debug POST:', error);
    return NextResponse.json(
      { error: 'Failed to process debug action' },
      { status: 500 }
    );
  }
}
