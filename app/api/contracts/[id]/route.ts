import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const contract = await prisma.document.findUnique({
      where: { id },
      include: {
        contractDetails: {
          include: {
            approvalHistory: {
              include: {
                approver: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    department: true
                  }
                }
              }
            },
            revisions: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    username: true
                  }
                },
                documentChanges: true
              },
              orderBy: [
                { version: 'desc' },
                { revisionNumber: 'desc' }
              ]
            }
          }
        },
        project: true,
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true
          }
        },
        finalizedDocument: true,
        lastUpdatedByUser: {
          select: {
            id: true,
            name: true,
            username: true
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

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Error fetching contract:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { content, title, contractType, approvers, metadata = {} } = body;

    // Get existing contract
    const existingContract = await prisma.document.findUnique({
      where: { id },
      include: { contractDetails: true }
    });

    if (!existingContract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (existingContract.documentType !== 'CONTRACT') {
      return NextResponse.json({ error: "Document is not a contract" }, { status: 400 });
    }

    // Check if contract is locked
    if (existingContract.contractDetails?.isLocked) {
      return NextResponse.json({ error: "Contract is locked and cannot be edited" }, { status: 400 });
    }

    // Check if user has permission to edit
    if (existingContract.ownerId !== session.user.id && !session.user.role?.includes('ADMIN')) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Create new revision
    const newRevision = await prisma.contractRevision.create({
      data: {
        contractId: existingContract.contractDetails!.id,
        version: existingContract.version + 1,
        revisionNumber: 1,
        content,
        changes: { 
          updated: true,
          previousVersion: existingContract.version,
          updatedAt: new Date().toISOString()
        },
        diff: null, // TODO: Implement diff generation
        createdBy: session.user.id,
        changeSummary: `Updated by ${session.user.name || session.user.username}`,
        changeCount: 1,
        requiresApproval: approvers?.length > 0
      }
    });

    // Update contract document
    const updatedContract = await prisma.document.update({
      where: { id },
      data: {
        title: title || existingContract.title,
        content,
        version: existingContract.version + 1,
        metadata: {
          ...existingContract.metadata,
          ...metadata,
          approvers,
          lastUpdated: new Date().toISOString()
        },
        lastUpdatedBy: session.user.name || session.user.username,
        lastUpdatedById: session.user.id,
        updatedAt: new Date()
      }
    });

    // Update contract details if needed
    if (contractType && contractType !== existingContract.contractDetails?.contractType) {
      await prisma.contractDetails.update({
        where: { documentId: id },
        data: {
          contractType,
          totalApprovalLevels: approvers?.length || 1
        }
      });
    }

    return NextResponse.json({
      ...updatedContract,
      revision: newRevision
    });
  } catch (error) {
    console.error("Error updating contract:", error);
    return NextResponse.json(
      { error: "Failed to update contract" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const contract = await prisma.document.findUnique({
      where: { id },
      include: { contractDetails: true }
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.documentType !== 'CONTRACT') {
      return NextResponse.json({ error: "Document is not a contract" }, { status: 400 });
    }

    // Check permissions
    if (contract.ownerId !== session.user.id && !session.user.role?.includes('ADMIN')) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Check if contract is finalized
    if (contract.workflowState === 'FINALIZED') {
      return NextResponse.json({ error: "Cannot delete finalized contracts" }, { status: 400 });
    }

    // Delete contract (cascade will handle related records)
    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Contract deleted successfully" });
  } catch (error) {
    console.error("Error deleting contract:", error);
    return NextResponse.json(
      { error: "Failed to delete contract" },
      { status: 500 }
    );
  }
}
