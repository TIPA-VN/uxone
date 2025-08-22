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

    console.log('🚀 Simple Workflow Request:', {
      contractId: id,
      action,
      comment,
      userId: session.user.id
    });

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

    console.log('📊 Contract State:', {
      id: contractDetails.id,
      currentLevel: contractDetails.currentApprovalLevel,
      totalLevels: contractDetails.totalApprovalLevels,
      currentStatus: contractDetails.contractStatus
    });

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

        console.log('✅ Approval Logic:', {
          currentLevel,
          nextLevel,
          totalLevels: contractDetails.totalApprovalLevels,
          isComplete
        });

        // Create approval record (ignore duplicates)
        try {
          await prisma.contractApproval.create({
            data: {
              contractId: id,
              approverId: session.user.id,
              level: currentLevel,
              status: 'APPROVED',
              comments: comment,
              approvedAt: new Date()
            }
          });
          console.log(`✅ Approval record created for level ${currentLevel}`);
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`⚠️ Approval already exists for level ${currentLevel}, continuing...`);
          } else {
            throw error;
          }
        }

        // Update contract
        const newStatus = isComplete ? 'APPROVED' : 'REVIEW';
        const newLevel = isComplete ? contractDetails.totalApprovalLevels : nextLevel;

        const approvedContract = await prisma.contractDetails.update({
          where: { id },
          data: {
            currentApprovalLevel: newLevel,
            contractStatus: newStatus,
            updatedAt: new Date()
          }
        });

        console.log('✅ Contract updated:', {
          newLevel: approvedContract.currentApprovalLevel,
          newStatus: approvedContract.contractStatus
        });

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
