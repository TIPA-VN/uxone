import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get contract details with related data
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
        revisions: {
          include: {
            creator: true
          },
          orderBy: { createdAt: 'desc' }
        },
        document: true
      }
    });

    if (!contractDetails) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      contract: contractDetails
    });

  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { action, content, ...updates } = body;

    // Get the contract details
    const contractDetails = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: true,
        document: true
      }
    });

    if (!contractDetails) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Handle different actions
    if (action === 'SAVE_DOCUMENT') {
      // Save document content
      if (contractDetails.document) {
        // Update existing document
        await prisma.document.update({
          where: { id: contractDetails.document.id },
          data: {
            content,
            updatedAt: new Date(),
            lastUpdatedById: session.user.id
          }
        });
      } else {
        // Create new document
        const document = await prisma.document.create({
          data: {
            fileName: `contract-${contractDetails.contractNumber || 'document'}.html`,
            filePath: `/contracts/${id}`,
            fileType: 'html',
            size: content.length,
            metadata: {
              contractId: id,
              contractNumber: contractDetails.contractNumber,
              documentType: 'CONTRACT'
            },
            title: `Contract ${contractDetails.contractNumber || 'Document'}`,
            content,
            documentType: 'CONTRACT',
            ownerId: session.user.id,
            lastUpdatedById: session.user.id,
            contractDetails: {
              connect: { id }
            }
          }
        });

        // Link document to contract
        await prisma.contractDetails.update({
          where: { id },
          data: {
            documentId: document.id
          }
        });
      }

      // Get current revision count
      const existingRevisions = await prisma.contractRevision.findMany({
        where: { contractId: id },
        orderBy: { createdAt: 'desc' }
      });

      // Create revision record
      await prisma.contractRevision.create({
        data: {
          contractId: id,
          version: 1,
          revisionNumber: existingRevisions.length + 1,
          content,
          changes: {
            action: 'SAVE_DOCUMENT',
            timestamp: new Date().toISOString(),
            performedBy: session.user.id
          },
          changeSummary: 'Document content saved',
          changeCount: 1,
          requiresApproval: false,
          createdBy: session.user.id
        }
      });
    } else {
      // Update contract details
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await prisma.contractDetails.update({
        where: { id },
        data: updateData
      });
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
        },
        revisions: {
          include: {
            creator: true
          },
          orderBy: { createdAt: 'desc' }
        },
        document: true
      }
    });

    return NextResponse.json({
      success: true,
      contract: updatedContract,
      message: action === 'SAVE_DOCUMENT' ? 'Document saved successfully' : 'Contract updated successfully'
    });

  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user has permission to delete
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete contract details (this will cascade to related records)
    await prisma.contractDetails.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Contract deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}
