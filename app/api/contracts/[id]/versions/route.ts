import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
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

    // Get contract details to verify it exists
    const contract = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        document: true,
        revisions: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          },
          orderBy: [
            { version: 'desc' },
            { revisionNumber: 'desc' }
          ]
        }
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Transform revisions to match DocumentVersionTimeline interface
    const versions = contract.revisions.map(revision => {
      // If contract is completed, all versions should be approved
      // Otherwise, check if revision has explicit approval
      let status = 'PENDING';
      if (contract.contractStatus === 'COMPLETED' || contract.contractStatus === 'SIGNED' || contract.contractStatus === 'EXECUTING') {
        status = 'APPROVED';
      } else if (revision.approvedBy) {
        status = 'APPROVED';
      }
      
      return {
        id: revision.id,
        version: revision.version,
        revisionNumber: revision.revisionNumber,
        content: revision.content,
        createdAt: revision.createdAt.toISOString(),
        createdBy: revision.creator.name || revision.creator.username || 'Unknown User',
        changeDescription: revision.changeSummary,
        changeSummary: revision.changeSummary,
        changeCount: revision.changeCount,
        requiresApproval: revision.requiresApproval,
        approvedBy: revision.approvedBy,
        approvedAt: revision.approvedAt?.toISOString(),
        status
      };
    });

    // Get current version from document or latest revision
    let currentVersion = 1;
    if (contract.document) {
      // You might want to store the current version in the document or contract
      currentVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 1;
    }

    return NextResponse.json({
      success: true,
      versions,
      currentVersion,
      totalVersions: versions.length
    });

  } catch (error) {
    console.error('Error fetching contract versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract versions' },
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
    const { content, changeSummary, changeCount, requiresApproval, userDisplayName } = await request.json();

    // Get current version info
    const existingRevisions = await prisma.contractRevision.findMany({
      where: { contractId: id },
      orderBy: [
        { version: 'desc' },
        { revisionNumber: 'desc' }
      ],
      take: 1
    });

    let newVersion = 1;
    let newRevisionNumber = 1;

    if (existingRevisions.length > 0) {
      const latest = existingRevisions[0];
      if (changeCount > 0) {
        // Major change - increment version
        newVersion = latest.version + 1;
        newRevisionNumber = 1;
      } else {
        // Minor change - increment revision
        newVersion = latest.version;
        newRevisionNumber = latest.revisionNumber + 1;
      }
    }

            // Create new revision
        const newRevision = await prisma.contractRevision.create({
          data: {
            contractId: id,
            version: newVersion,
            revisionNumber: newRevisionNumber,
            content,
            changes: {
              action: 'CONTENT_UPDATE',
              timestamp: new Date().toISOString(),
              performedBy: session.user.id,
              userDisplayName: userDisplayName || session.user.name || session.user.username
            },
            changeSummary,
            changeCount,
            requiresApproval,
            createdBy: session.user.id
          }
        });

    return NextResponse.json({
      success: true,
      revision: {
        id: newRevision.id,
        version: newRevision.version,
        revisionNumber: newRevision.revisionNumber,
        createdAt: newRevision.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating contract revision:', error);
    return NextResponse.json(
      { error: 'Failed to create contract revision' },
      { status: 500 }
    );
  }
}
