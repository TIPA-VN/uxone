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
    const { action, comment, approverId } = await request.json();

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
        newStatus = 'APPROVED';
        workflowMessage = 'Contract approved';
        break;
      case 'REJECT':
        newStatus = 'TERMINATED';
        workflowMessage = 'Contract terminated';
        break;
      case 'SIGN':
        newStatus = 'SIGNED';
        workflowMessage = 'Contract signed';
        break;
      case 'EXECUTE':
        newStatus = 'EXECUTING';
        workflowMessage = 'Contract execution started';
        break;
      case 'COMPLETE':
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
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Create approval record if this is an approval action
    if (action === 'APPROVE' || action === 'REJECT') {
      await prisma.contractApproval.create({
        data: {
          contractId: id,
          approverId: session.user.id,
          level: contractDetails.currentApprovalLevel,
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          comments: comment,
          approvedAt: new Date()
        }
      });

      // Update approval level if approved
      if (action === 'APPROVE') {
        const nextLevel = contractDetails.currentApprovalLevel + 1;
        if (nextLevel <= contractDetails.totalApprovalLevels) {
          await prisma.contractDetails.update({
            where: { id },
            data: {
              currentApprovalLevel: nextLevel,
              contractStatus: nextLevel === contractDetails.totalApprovalLevels ? 'APPROVED' : 'REVIEW'
            }
          });
        }
      }
    }

    // Update contract status
    if (newStatus !== contractDetails.contractStatus) {
      await prisma.contractDetails.update({
        where: { id },
        data: {
          contractStatus: newStatus,
          updatedAt: new Date()
        }
      });
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
      message: workflowMessage
    });

  } catch (error) {
    console.error('Contract workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to process contract workflow action' },
      { status: 500 }
    );
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
