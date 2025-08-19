import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const contractType = searchParams.get('contractType');
    const status = searchParams.get('status');
    const department = searchParams.get('department');

    // Build where clause
    const where: any = {};
    
    if (projectId) where.projectId = projectId;
    if (contractType) where.contractDetails = { contractType };
    if (status) where.workflowState = status;
    if (department) where.department = department;

    // Get contracts with related data
    const contracts = await prisma.document.findMany({
      where: {
        ...where,
        documentType: 'CONTRACT'
      },
      include: {
        contractDetails: true,
        project: true,
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true
          }
        },
        finalizedDocument: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      contractType,
      projectId,
      department,
      approvers,
      dueDate,
      metadata = {}
    } = body;

    // Validate required fields
    if (!title || !content || !contractType) {
      return NextResponse.json(
        { error: "Title, content, and contract type are required" },
        { status: 400 }
      );
    }

    // Create contract document
    const contract = await prisma.document.create({
      data: {
        fileName: `${title}.contract`,
        filePath: `/contracts/${Date.now()}_${title.replace(/\s+/g, '_')}.html`,
        fileType: 'text/html',
        size: Buffer.byteLength(content, 'utf8'),
        version: 1,
        metadata: {
          ...metadata,
          type: 'CONTRACT',
          contractType,
          approvers,
          dueDate
        },
        ownerId: session.user.id,
        department: department || session.user.department,
        accessRoles: [session.user.role || 'STAFF'],
        ...(projectId && { projectId }), // Only include projectId if it's provided
        documentType: 'CONTRACT',
        title,
        content,
        isEditable: true,
        workflowState: 'DRAFT'
      }
    });

    // Create contract details
    const contractDetails = await prisma.contractDetails.create({
      data: {
        documentId: contract.id,
        contractType,
        isLocked: false,
        currentApprovalLevel: 1,
        totalApprovalLevels: approvers?.length || 1,
        startDate: new Date(),
        value: metadata.value || null,
        currency: metadata.currency || 'USD'
      }
    });

    // Create initial revision
    const revision = await prisma.contractRevision.create({
      data: {
        contractId: contractDetails.id,
        version: 1,
        revisionNumber: 1,
        content,
        changes: { initial: true },
        diff: null,
        createdBy: session.user.id,
        changeSummary: 'Initial contract creation',
        changeCount: 0,
        requiresApproval: approvers?.length > 0
      }
    });

    return NextResponse.json({
      ...contract,
      contractDetails,
      revision
    });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: "Failed to create contract" },
      { status: 500 }
    );
  }
}
