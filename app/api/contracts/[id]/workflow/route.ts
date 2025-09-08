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

    // Get current user for role checking
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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

    // Helper function to check if user can approve at current level
    const canUserApproveAtLevel = (userRole: string, level: number, userDepartment?: string, contractDepartment?: string): boolean => {
      const normalizedRole = userRole?.toUpperCase().trim();
      
      // Admin can approve at any level
      if (normalizedRole === 'ADMIN') {
        return true;
      }
      
      // Get contract department for department-specific rules
      const contractDept = contractDepartment || contractDetails?.project?.departments?.[0] || '';
      
      // LEGAL department specific approval hierarchy
      if (contractDept.toUpperCase() === 'LEGAL') {
        const legalApprovalLevels: { [key: string]: number } = {
          'GENERAL_DIRECTOR': 3,
          'GENERAL DIRECTOR': 3,
          'VICE_GENERAL_DIRECTOR': 3,
          'VICE GENERAL DIRECTOR': 3,
          'CHIEF_SPECIALIST': 2,
          'CHIEF SPECIALIST': 2
        };
        
        // For LEGAL department, check if user is in LEGAL department and has appropriate role
        if (userDepartment?.toUpperCase() === 'LEGAL') {
          const userMaxLevel = legalApprovalLevels[normalizedRole] || 0;
          return userMaxLevel >= level;
        }
        
        // General Director and Vice General Director can approve LEGAL contracts at level 3
        if (normalizedRole === 'GENERAL_DIRECTOR' || normalizedRole === 'GENERAL DIRECTOR' ||
            normalizedRole === 'VICE_GENERAL_DIRECTOR' || normalizedRole === 'VICE GENERAL DIRECTOR') {
          return level <= 3;
        }
      }
      
      // Level 1 approval requires Purchasing Department Management or GM/AGM
      if (level === 1) {
        // Check if user is in Purchasing Department with management role
        const isPurchasingDept = userDepartment?.toUpperCase() === 'LVM-PUR' || 
                                userDepartment?.toUpperCase() === 'PROC' || 
                                userDepartment?.toUpperCase() === 'PR';
        
        const isManagementRole = [
          'GENERAL_MANAGER', 'GENERAL MANAGER',
          'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT GENERAL MANAGER',
          'ASSISTANT_GENERAL_MANAGER_2', 'ASSISTANT GENERAL MANAGER 2',
          'SENIOR_MANAGER', 'SENIOR MANAGER',
          'SENIOR_MANAGER_2', 'SENIOR MANAGER 2',
          'ASSISTANT_SENIOR_MANAGER', 'ASSISTANT SENIOR MANAGER',
          'MANAGER', 'MANAGER 2', 'MANAGER_2',
          'ASSISTANT_MANAGER', 'ASSISTANT MANAGER',
          'ASSISTANT_MANAGER_2', 'ASSISTANT MANAGER 2'
        ].includes(normalizedRole);
        
        // Level 1: Purchasing Department Management OR any GM/AGM
        return (isPurchasingDept && isManagementRole) || 
               (normalizedRole === 'GENERAL_MANAGER' || normalizedRole === 'GENERAL MANAGER' ||
                normalizedRole === 'ASSISTANT_GENERAL_MANAGER' || normalizedRole === 'ASSISTANT GENERAL MANAGER' ||
                normalizedRole === 'ASSISTANT_GENERAL_MANAGER_2' || normalizedRole === 'ASSISTANT GENERAL MANAGER 2');
      }
      
      // Default approval levels for other levels (2-4)
      const approvalLevels: { [key: string]: number } = {
        'GENERAL_DIRECTOR': 4,
        'GENERAL DIRECTOR': 4,
        'GENERAL_MANAGER': 3,
        'GENERAL MANAGER': 3,
        'ASSISTANT_GENERAL_MANAGER': 3,
        'ASSISTANT GENERAL MANAGER': 3,
        'ASSISTANT_GENERAL_MANAGER_2': 3,
        'ASSISTANT GENERAL MANAGER 2': 3,
        'SENIOR_MANAGER': 2,
        'SENIOR MANAGER': 2,
        'SENIOR_MANAGER_2': 2,
        'SENIOR MANAGER 2': 2,
        'ASSISTANT_SENIOR_MANAGER': 2,
        'ASSISTANT SENIOR MANAGER': 2,
        'MANAGER': 1,
        'MANAGER 2': 1,
        'MANAGER_2': 1,
        'ASSISTANT_MANAGER': 1,
        'ASSISTANT MANAGER': 1,
        'ASSISTANT_MANAGER_2': 1,
        'ASSISTANT MANAGER 2': 1
      };
      
      const userMaxLevel = approvalLevels[normalizedRole] || 0;
      return userMaxLevel >= level;
    };

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

        // Check if user has permission to approve at current level
        const currentLevel = contractDetails.currentApprovalLevel;
        
        if (!canUserApproveAtLevel(currentUser.role || 'STAFF', currentLevel, currentUser.department || '', contractDetails.project?.departments?.[0] || '')) {
          return NextResponse.json({
            success: false,
            error: 'Insufficient permissions',
            message: `You don't have permission to approve at level ${currentLevel}. Required role level: ${currentLevel}`,
            contract: contractDetails
          }, { status: 403 });
        }

        // Simple approval logic - advance one level at a time
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
        // Check if user has permission to reject at current level
        const rejectLevel = contractDetails.currentApprovalLevel;
        
        if (!canUserApproveAtLevel(currentUser.role || 'STAFF', rejectLevel, currentUser.department || '', contractDetails.project?.departments?.[0] || '')) {
          return NextResponse.json({
            success: false,
            error: 'Insufficient permissions',
            message: `You don't have permission to reject at level ${rejectLevel}. Required role level: ${rejectLevel}`,
            contract: contractDetails
          }, { status: 403 });
        }

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
