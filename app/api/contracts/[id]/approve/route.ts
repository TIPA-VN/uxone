import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, comments, approvers } = body;

    if (!['submit', 'approve', 'reject', 'request_changes'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get contract with details
    const contract = await prisma.document.findUnique({
      where: { id },
      include: {
        contractDetails: {
          include: {
            approvalHistory: {
              include: {
                approver: true
              }
            }
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.documentType !== 'CONTRACT') {
      return NextResponse.json({ error: "Document is not a contract" }, { status: 400 });
    }

    const contractDetails = contract.contractDetails;
    if (!contractDetails) {
      return NextResponse.json({ error: "Contract details not found" }, { status: 400 });
    }

    switch (action) {
      case 'submit':
        return await handleSubmitForApproval(contract, contractDetails, session.user, approvers);
      
      case 'approve':
        return await handleApproval(contract, contractDetails, session.user, 'APPROVED', comments);
      
      case 'reject':
        return await handleApproval(contract, contractDetails, session.user, 'REJECTED', comments);
      
      case 'request_changes':
        return await handleApproval(contract, contractDetails, session.user, 'COMMENTED', comments);
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in contract approval:", error);
    return NextResponse.json(
      { error: "Failed to process approval action" },
      { status: 500 }
    );
  }
}

async function handleSubmitForApproval(contract: any, contractDetails: any, user: any, approvers: string[]) {
  // Check if user is the contract owner
  if (contract.ownerId !== user.id) {
    return NextResponse.json({ error: "Only contract owner can submit for approval" }, { status: 403 });
  }

  // Check if contract is already submitted
  if (contract.workflowState === 'IN_REVIEW') {
    return NextResponse.json({ error: "Contract is already submitted for approval" }, { status: 400 });
  }

  // Create approval records for each approver
  const approvalRecords = await Promise.all(
    approvers.map(async (approverEmail: string, index: number) => {
      const approverUser = await prisma.user.findFirst({
        where: { email: approverEmail }
      });

      if (!approverUser) {
        throw new Error(`Approver not found: ${approverEmail}`);
      }

      return prisma.contractApproval.create({
        data: {
          contractId: contractDetails.id,
          approverId: approverUser.id,
          level: index + 1,
          status: 'PENDING',
          comments: null
        }
      });
    })
  );

  // Update contract workflow state
  await prisma.document.update({
    where: { id: contract.id },
    data: {
      workflowState: 'IN_REVIEW',
      metadata: {
        ...contract.metadata,
        submittedForApproval: new Date().toISOString(),
        approvers
      }
    }
  });

  // Update contract details
  await prisma.contractDetails.update({
    where: { id: contractDetails.id },
    data: {
      totalApprovalLevels: approvers.length,
      currentApprovalLevel: 1
    }
  });

  return NextResponse.json({
    message: "Contract submitted for approval",
    approvalRecords,
    nextApprover: approvers[0]
  });
}

async function handleApproval(contract: any, contractDetails: any, user: any, status: string, comments?: string) {
  // Find user's approval record
  const userApproval = await prisma.contractApproval.findFirst({
    where: {
      contractId: contractDetails.id,
      approverId: user.id,
      status: 'PENDING'
    }
  });

  if (!userApproval) {
    return NextResponse.json({ error: "No pending approval found for this user" }, { status: 400 });
  }

  // Update approval record
  await prisma.contractApproval.update({
    where: { id: userApproval.id },
    data: {
      status,
      comments,
      approvedAt: new Date()
    }
  });

  if (status === 'REJECTED') {
    // Contract rejected - reset workflow
    await prisma.document.update({
      where: { id: contract.id },
      data: {
        workflowState: 'DRAFT',
        metadata: {
          ...contract.metadata,
          rejectedAt: new Date().toISOString(),
          rejectedBy: user.id,
          rejectionReason: comments
        }
      }
    });

    return NextResponse.json({
      message: "Contract rejected",
      workflowState: 'DRAFT'
    });
  }

  if (status === 'COMMENTED') {
    // Request changes - keep in review but notify owner
    return NextResponse.json({
      message: "Changes requested",
      workflowState: 'IN_REVIEW'
    });
  }

  // Approved - check if all approvals are complete
  const pendingApprovals = await prisma.contractApproval.count({
    where: {
      contractId: contractDetails.id,
      status: 'PENDING'
    }
  });

  if (pendingApprovals === 0) {
    // All approvals complete - finalize contract
    await prisma.document.update({
      where: { id: contract.id },
      data: {
        workflowState: 'APPROVED',
        metadata: {
          ...contract.metadata,
          approvedAt: new Date().toISOString(),
          approvedBy: user.id
        }
      }
    });

    // Lock contract
    await prisma.contractDetails.update({
      where: { id: contractDetails.id },
      data: {
        isLocked: true
      }
    });

    return NextResponse.json({
      message: "Contract approved and finalized",
      workflowState: 'APPROVED',
      isLocked: true
    });
  } else {
    // Move to next approval level
    const nextApproval = await prisma.contractApproval.findFirst({
      where: {
        contractId: contractDetails.id,
        status: 'PENDING'
      },
      orderBy: { level: 'asc' }
    });

    await prisma.contractDetails.update({
      where: { id: contractDetails.id },
      data: {
        currentApprovalLevel: nextApproval?.level || contractDetails.currentApprovalLevel + 1
      }
    });

    return NextResponse.json({
      message: "Approval recorded, waiting for next approver",
      workflowState: 'IN_REVIEW',
      nextApprover: nextApproval?.approverId
    });
  }
}
