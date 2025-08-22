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
    const { action, comment, approverId } = requestBody;
    
    // Log the request for debugging
    console.log('Workflow request received:', {
      contractId: id,
      action,
      comment,
      approverId,
      fullBody: requestBody
    });

    // Get the contract details
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
        }
      }
    });
    
    console.log('🔍 Contract Details for Workflow:', {
      id: contractDetails?.id,
      currentApprovalLevel: contractDetails?.currentApprovalLevel,
      totalApprovalLevels: contractDetails?.totalApprovalLevels,
      contractStatus: contractDetails?.contractStatus,
      approvalHistoryCount: contractDetails?.approvalHistory?.length || 0
    });
    
    // Verify approval levels are correct
    if (contractDetails) {
      console.log('🔍 Approval Level Verification:', {
        currentLevel: contractDetails.currentApprovalLevel,
        totalLevels: contractDetails.totalApprovalLevels,
        isLevelValid: contractDetails.currentApprovalLevel >= 1 && contractDetails.currentApprovalLevel <= contractDetails.totalApprovalLevels,
        expectedNextLevel: contractDetails.currentApprovalLevel + 1,
        willComplete: (contractDetails.currentApprovalLevel + 1) >= contractDetails.totalApprovalLevels
      });
    }

    if (!contractDetails) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if user has permission to perform workflow actions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine new status based on action
    let newStatus = contractDetails.contractStatus;
    let requiresApproval = false;
    let workflowMessage = '';

    switch (action) {
      case 'SEND_REVIEW':
        newStatus = 'REVIEW';
        workflowMessage = 'Contract sent for review';
        break;
      case 'APPROVE':
      case 'APPROVED':
        // Don't set status here - let the approval logic handle it
        workflowMessage = 'Contract approval processed';
        break;
      case 'REJECT':
      case 'REJECTED':
        newStatus = 'TERMINATED';
        workflowMessage = 'Contract terminated';
        break;
      case 'SIGN':
      case 'SIGNED':
        newStatus = 'SIGNED';
        workflowMessage = 'Contract signed';
        break;
      case 'EXECUTE':
      case 'EXECUTING':
        newStatus = 'EXECUTING';
        workflowMessage = 'Contract execution started';
        break;
      case 'COMPLETE':
      case 'COMPLETED':
        newStatus = 'COMPLETED';
        workflowMessage = 'Contract completed';
        break;
      case 'REOPEN':
        newStatus = 'DRAFT';
        workflowMessage = 'Contract reopened for editing';
        break;
      case 'REQUEST_APPROVAL':
        requiresApproval = true;
        workflowMessage = 'Approval request sent';
        break;
      default:
        console.error('Invalid action received:', action);
        return NextResponse.json({ 
          error: 'Invalid action', 
          receivedAction: action,
          validActions: ['SEND_REVIEW', 'APPROVE', 'APPROVED', 'REJECT', 'REJECTED', 'SIGN', 'SIGNED', 'EXECUTE', 'EXECUTING', 'COMPLETE', 'COMPLETED', 'REOPEN', 'REQUEST_APPROVAL']
        }, { status: 400 });
    }

    // Create approval record if this is an approval action
    if (action === 'APPROVE' || action === 'APPROVED' || action === 'REJECT' || action === 'REJECTED') {
      await prisma.contractApproval.create({
        data: {
          contractId: id,
          approverId: session.user.id,
          level: contractDetails.currentApprovalLevel,
          status: (action === 'APPROVE' || action === 'APPROVED') ? 'APPROVED' : 'REJECTED',
          comments: comment,
          approvedAt: new Date()
        }
      });

      // Update approval level if approved
      if (action === 'APPROVE' || action === 'APPROVED') {
        console.log('🔍 Starting approval process...');
        console.log('Current contract state:', {
          contractId: contractDetails.id,
          currentApprovalLevel: contractDetails.currentApprovalLevel,
          totalApprovalLevels: contractDetails.totalApprovalLevels,
          currentStatus: contractDetails.contractStatus
        });
        
        const nextLevel = contractDetails.currentApprovalLevel + 1;
        console.log('Approval Debug:', {
          currentLevel: contractDetails.currentApprovalLevel,
          nextLevel,
          totalLevels: contractDetails.totalApprovalLevels,
          willBeApproved: nextLevel === contractDetails.totalApprovalLevels,
          isFinalApproval: nextLevel >= contractDetails.totalApprovalLevels
        });
        
        if (nextLevel <= contractDetails.totalApprovalLevels) {
          console.log(`📈 Updating approval level from ${contractDetails.currentApprovalLevel} to ${nextLevel}`);
          
          // Validate that we're not accidentally resetting approval levels
          if (nextLevel < contractDetails.currentApprovalLevel) {
            console.error('❌ ERROR: Attempting to decrease approval level!', {
              current: contractDetails.currentApprovalLevel,
              next: nextLevel
            });
            return NextResponse.json({ 
              error: 'Invalid approval level progression' 
            }, { status: 400 });
          }
          
          // Check if we've already approved this level
          const existingApproval = await prisma.contractApproval.findFirst({
            where: {
              contractId: id,
              approverId: session.user.id,
              level: contractDetails.currentApprovalLevel
            }
          });
          
          if (existingApproval) {
            console.log('⚠️ User has already approved this level, skipping duplicate approval');
            return NextResponse.json({
              success: true,
              message: 'Already approved this level',
              contract: contractDetails
            });
          }
          
          // Check if contract is already completed
          if (contractDetails.contractStatus === 'APPROVED') {
            console.log('⚠️ Contract is already approved, cannot approve again');
            return NextResponse.json({
              success: true,
              message: 'Contract is already approved',
              contract: contractDetails
            });
          }
          
          console.log('🔍 Before database update:', {
            nextLevel,
            totalLevels: contractDetails.totalApprovalLevels,
            willSetStatus: nextLevel === contractDetails.totalApprovalLevels ? 'APPROVED' : 'REVIEW'
          });
          
          // Check if we've completed all required approvals
          // We need to count actual approval records, not just levels
          const approvalCount = await prisma.contractApproval.count({
            where: { 
              contractId: id,
              status: 'APPROVED'
            }
          });
          
          console.log('🔍 Approval Count Check:', {
            approvalCount,
            totalRequired: contractDetails.totalApprovalLevels,
            hasCompletedAll: approvalCount >= contractDetails.totalApprovalLevels
          });
          
          const updatedContract = await prisma.contractDetails.update({
            where: { id },
            data: {
              currentApprovalLevel: nextLevel,
              // Only approve when we have completed ALL required approvals
              contractStatus: approvalCount >= contractDetails.totalApprovalLevels ? 'APPROVED' : 'REVIEW'
            }
          });
          
          console.log('✅ Contract updated after approval:', {
            newLevel: updatedContract.currentApprovalLevel,
            newStatus: updatedContract.contractStatus,
            isFinalApproval: nextLevel === contractDetails.totalApprovalLevels,
            shouldFinalize: nextLevel >= contractDetails.totalApprovalLevels,
            databaseResult: {
              actualLevel: updatedContract.currentApprovalLevel,
              actualStatus: updatedContract.contractStatus
            }
          });
          
          // If this is the final approval, create finalized document
          if (approvalCount >= contractDetails.totalApprovalLevels && contractDetails.documentId) {
            console.log('🎉 Final approval reached! Starting document finalization...');
            console.log('Document ID:', contractDetails.documentId);
            
            try {
              // Import the finalization function
              const { generateContractPDF } = await import('@/lib/pdf-generator');
              const { generateDigitalSignature } = await import('@/lib/digital-signature');
              const crypto = await import('crypto');
              
              console.log('✅ Libraries imported successfully');
              
              // Get the document content
              const document = await prisma.document.findUnique({
                where: { id: contractDetails.documentId }
              });

              console.log('Document found:', !!document, 'Content length:', document?.content?.length || 0);

              if (document) {
                console.log('🔒 Generating checksum...');
                // Generate checksum for document integrity
                const checksum = crypto.createHash('sha256').update(document.content || '').digest('hex');
                
                console.log('📄 Generating PDF...');
                // Generate PDF for the finalized document
                const pdfBase64 = await generateContractPDF({
                  title: `Approved Contract - ${contractDetails.contractNumber || 'N/A'}`,
                  content: document.content || '',
                  contractNumber: contractDetails.contractNumber,
                  counterparty: contractDetails.counterparty,
                  value: contractDetails.value?.toString(),
                  currency: contractDetails.currency,
                  contractStatus: 'APPROVED',
                  approvedBy: [session.user.id],
                  approvedAt: new Date()
                });
                
                console.log('📝 Generating digital signature...');
                // Generate digital signature
                const digitalSignature = await generateDigitalSignature({
                  content: document.content || '',
                  signerId: session.user.id,
                  signerName: session.user.name || 'Unknown',
                  timestamp: new Date(),
                  contractNumber: contractDetails.contractNumber
                });
                
                console.log('💾 Creating finalized document record...');
                // Create finalized document
                const finalizedDoc = await prisma.finalizedDocument.create({
                  data: {
                    originalDocumentId: contractDetails.documentId,
                    finalizedContent: document.content || '',
                    finalizedHtml: document.content || '',
                    finalizedPdf: pdfBase64,
                    approvedBy: [session.user.id],
                    approvedAt: new Date(),
                    title: `Approved Contract - ${contractDetails.contractNumber || 'N/A'}`,
                    contractNumber: contractDetails.contractNumber,
                    version: document.version || 1,
                    revisionNumber: 1,
                    digitalSignature: JSON.stringify(digitalSignature),
                    checksum: checksum,
                    isLegallyBinding: true,
                    storageLocation: 'ACTIVE_ARCHIVE',
                    storageType: 'ACTIVE_ARCHIVE',
                    finalizationNotes: 'Contract approved and finalized through workflow',
                    archivedBy: session.user.id
                  }
                });

                console.log('✅ Finalized document created:', finalizedDoc.id);

                console.log('🔒 Locking original document...');
                // Lock the original document
                await prisma.document.update({
                  where: { id: contractDetails.documentId },
                  data: {
                    isEditable: false,
                    workflowState: 'APPROVED',
                    workflowMeta: {
                      approvedAt: new Date(),
                      approvedBy: session.user.id,
                      finalVersion: document.version || 1,
                      finalized: true
                    }
                  }
                });

                console.log('🎉 Document finalization completed successfully!');
              } else {
                console.error('❌ Document not found for finalization');
              }
            } catch (finalizationError) {
              console.error('❌ Error creating finalized document:', finalizationError);
              console.error('Finalization error details:', {
                error: finalizationError,
                message: finalizationError instanceof Error ? finalizationError.message : 'Unknown error',
                stack: finalizationError instanceof Error ? finalizationError.stack : undefined
              });
              // Don't fail the approval if finalization fails
            }
          } else {
            console.log('📋 Not final approval yet:', {
              nextLevel,
              totalLevels: contractDetails.totalApprovalLevels,
              hasDocument: !!contractDetails.documentId
            });
          }
        }
      }
    }

    // Update contract status (only if not already handled by approval logic)
    if (newStatus !== contractDetails.contractStatus && action !== 'APPROVE' && action !== 'APPROVED') {
      console.log(`🔄 Updating contract status from ${contractDetails.contractStatus} to ${newStatus}`);
      await prisma.contractDetails.update({
        where: { id },
        data: {
          contractStatus: newStatus,
          updatedAt: new Date()
        }
      });
    } else if (action === 'APPROVE' || action === 'APPROVED') {
      console.log('✅ Approval status already handled by approval logic, skipping general status update');
    }

    // Create notification for approval request if needed
    if (requiresApproval) {
      // Find users who can approve (managers and above)
      const approvers = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'MANAGER' },
            { role: 'SUPERVISOR' },
            { role: 'ADMIN' }
          ]
        }
      });

      // Create notifications for approvers
      for (const approver of approvers) {
        await prisma.notification.create({
          data: {
            userId: approver.id,
            title: 'Contract Approval Request',
            message: `Contract ${contractDetails.contractNumber || 'N/A'} requires your approval`,
            type: 'CONTRACT_APPROVAL',
            link: `/lvm/projects/${contractDetails.projectId}?tab=CONTRACT`,
            read: false
          }
        });
      }
    }

    // Create workflow log entry
    try {
      // Get current revision count
      const existingRevisions = await prisma.contractRevision.findMany({
        where: { contractId: id },
        orderBy: { createdAt: 'desc' }
      });

      await prisma.contractRevision.create({
        data: {
          contractId: id,
          version: 1,
          revisionNumber: existingRevisions.length + 1,
          content: contractDetails.document?.content || '',
          changes: {
            action,
            previousStatus: contractDetails.contractStatus,
            newStatus,
            comment,
            performedBy: session.user.id,
            timestamp: new Date().toISOString()
          },
          changeSummary: `${action} - ${workflowMessage}`,
          changeCount: 1,
          requiresApproval: false,
          createdBy: session.user.id
        }
      });
    } catch (revisionError) {
      console.error('Error creating workflow revision:', revisionError);
      // Don't fail the workflow if revision creation fails
    }

    // Get updated contract details
    const updatedContract = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: true,
        currentApprover: true,
        approvalHistory: {
          include: {
            approver: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      contract: updatedContract,
      message: workflowMessage,
      contractStatus: updatedContract?.contractStatus,
      currentApprovalLevel: updatedContract?.currentApprovalLevel,
      totalApprovalLevels: updatedContract?.totalApprovalLevels
    });

  } catch (error) {
    console.error('Contract workflow error:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to process contract workflow action';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific Prisma errors
      if (error.message.includes('Record to update not found')) {
        errorMessage = 'Contract not found or has been modified';
        statusCode = 404;
      } else if (error.message.includes('Unique constraint')) {
        errorMessage = 'Duplicate workflow action detected';
        statusCode = 409;
      }
    }
    
    return NextResponse.json({
      error: errorMessage,
      action: action || 'UNKNOWN',
      contractId: id,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
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

    // Get contract workflow history (revisions)
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
