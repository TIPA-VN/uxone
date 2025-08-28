import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const requestBody = await request.json();
    const { action, comment } = requestBody;

        // Get the contract details
    const contractDetails = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: true,
        document: true,
        approvalHistory: {
          include: {
            approver: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!contractDetails) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

        // Handle different actions
    switch (action) {
      case 'SEND_REVIEW':
        const reviewContract = await prisma.contractDetails.update({
          where: { id },
          data: {
            contractStatus: 'REVIEW',
            currentApprovalLevel: 1,
            updatedAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Contract sent for review',
          contract: reviewContract,
          contractStatus: reviewContract.contractStatus,
          currentApprovalLevel: reviewContract.currentApprovalLevel,
          totalApprovalLevels: reviewContract.totalApprovalLevels
        });

      case 'APPROVE':
      case 'APPROVED':
                // Check if already fully approved
        if (contractDetails.contractStatus === 'APPROVED') {
                    return NextResponse.json({
            success: true,
            message: 'Contract is already approved',
            contract: contractDetails,
            contractStatus: contractDetails.contractStatus,
            currentApprovalLevel: contractDetails.currentApprovalLevel,
            totalApprovalLevels: contractDetails.totalApprovalLevels
          });
        }

        // Simple approval logic - advance one level at a time
        const currentLevel = contractDetails.currentApprovalLevel;
        const nextLevel = currentLevel + 1;
        const isComplete = nextLevel > contractDetails.totalApprovalLevels;

                // Create approval record (ignore duplicates)
                try {
          const approvalRecord = await prisma.contractApproval.create({
            data: {
              contractId: id,
              approverId: session.user.id,
              level: currentLevel,
              status: 'APPROVED',
              comments: comment,
              approvedAt: new Date()
            }
          });
                  } catch (error: any) {
          if (error.code === 'P2002') {
                      } else {
            console.error('❌ Error creating approval record:', error);
            throw error;
          }
        }

        // Update contract
        const newStatus = isComplete ? 'APPROVED' : 'REVIEW';
        const newLevel = isComplete ? contractDetails.totalApprovalLevels : nextLevel;

                let approvedContract;
        try {
          approvedContract = await prisma.contractDetails.update({
            where: { id },
            data: {
              currentApprovalLevel: newLevel,
              contractStatus: newStatus,
              updatedAt: new Date()
            }
          });
          
                  } catch (updateError) {
          console.error('❌ Error updating contract:', updateError);
          throw updateError;
        }

                return NextResponse.json({
          success: true,
          message: newStatus === 'APPROVED' ? 'Contract fully approved' : `Approved level ${currentLevel} of ${contractDetails.totalApprovalLevels}`,
          contract: approvedContract,
          contractStatus: approvedContract.contractStatus,
          currentApprovalLevel: approvedContract.currentApprovalLevel,
          totalApprovalLevels: approvedContract.totalApprovalLevels
        });

      case 'REJECT':
      case 'REJECTED':
        await prisma.contractApproval.create({
          data: {
            contractId: id,
            approverId: session.user.id,
            level: contractDetails.currentApprovalLevel,
            status: 'REJECTED',
            comments: comment,
            approvedAt: new Date()
          }
        });

        const rejectedContract = await prisma.contractDetails.update({
          where: { id },
          data: {
            contractStatus: 'TERMINATED',
            updatedAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Contract rejected and terminated',
          contract: rejectedContract,
          contractStatus: rejectedContract.contractStatus,
          currentApprovalLevel: rejectedContract.currentApprovalLevel,
          totalApprovalLevels: rejectedContract.totalApprovalLevels
        });

      case 'SIGN':
      case 'SIGNED':
        const signedContract = await prisma.contractDetails.update({
          where: { id },
          data: {
            contractStatus: 'SIGNED',
            updatedAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Contract signed',
          contract: signedContract,
          contractStatus: signedContract.contractStatus,
          currentApprovalLevel: signedContract.currentApprovalLevel,
          totalApprovalLevels: signedContract.totalApprovalLevels
        });

      case 'EXECUTE':
      case 'EXECUTING':
        const executingContract = await prisma.contractDetails.update({
          where: { id },
          data: {
            contractStatus: 'EXECUTING',
            updatedAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Contract execution started',
          contract: executingContract,
          contractStatus: executingContract.contractStatus,
          currentApprovalLevel: executingContract.currentApprovalLevel,
          totalApprovalLevels: executingContract.totalApprovalLevels
        });

      case 'COMPLETE':
      case 'COMPLETED':
        const completedContract = await prisma.contractDetails.update({
          where: { id },
          data: {
            contractStatus: 'COMPLETED',
            updatedAt: new Date()
          }
        });

        // Generate finalized document when contract is completed
        try {
                    // Get the contract document content
          const contractWithDocument = await prisma.contractDetails.findUnique({
            where: { id },
            include: {
              document: true,
              project: true
            }
          });

                    if (contractWithDocument?.document?.content) {
            // Generate PDF from document content
            const { generateContractPDF } = await import('@/lib/pdf-generator');
            const pdfBuffer = await generateContractPDF({
              content: contractWithDocument.document.content,
              contractNumber: contractWithDocument.contractNumber,
              counterparty: contractWithDocument.counterparty,
              value: contractWithDocument.value?.toString(),
              currency: contractWithDocument.currency,
              contractStatus: contractWithDocument.contractStatus
            });
            
            // Generate digital signature
            const { generateDigitalSignature } = await import('@/lib/digital-signature');
            const signature = await generateDigitalSignature({
              content: contractWithDocument.document?.content || '',
              signerId: session.user.id,
              signerName: session.user.name || session.user.username || 'Unknown',
              timestamp: new Date(),
              contractNumber: contractWithDocument.contractNumber
            });
            
            // Create finalized document record
            const finalizedDoc = await prisma.finalizedDocument.create({
              data: {
                originalDocumentId: contractWithDocument.documentId || '',
                finalizedContent: contractWithDocument.document?.content || '',
                finalizedPdf: pdfBuffer.toString('base64'),
                approvedBy: [session.user.id],
                approvedAt: new Date(),
                title: `Contract_${contractWithDocument.contractNumber || id}_Finalized`,
                contractNumber: contractWithDocument.contractNumber,
                version: 1,
                revisionNumber: 1,
                digitalSignature: JSON.stringify(signature),
                checksum: signature.hash || 'generated',
                storageLocation: `/api/contracts/${id}/finalized/download`,
                archivedBy: session.user.id
              }
            });
            
                      } else {
                                  }
        } catch (finalizeError) {
          console.error('❌ Error generating finalized document:', finalizeError);
          // Don't fail the workflow if finalized document generation fails
        }

        return NextResponse.json({
          success: true,
          message: 'Contract completed',
          contract: completedContract,
          contractStatus: completedContract.contractStatus,
          currentApprovalLevel: completedContract.currentApprovalLevel,
          totalApprovalLevels: completedContract.totalApprovalLevels
        });

      default:
        return NextResponse.json({ 
          error: 'Invalid action', 
          receivedAction: action,
          validActions: ['SEND_REVIEW', 'APPROVE', 'REJECT', 'SIGN', 'EXECUTE', 'COMPLETE']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Workflow error:', error);
    return NextResponse.json({
      error: 'Failed to process workflow action',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

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

    // Get contract workflow history
    const workflowHistory = await prisma.contractRevision.findMany({
      where: { contractId: id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      workflowHistory
    });

  } catch (error) {
    console.error('Error fetching workflow history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow history' },
      { status: 500 }
    );
  }
}
