import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Fetch all addendums for a contract
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

    // Get the parent contract and its addendums
    const contract = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        addendums: {
          include: {
            project: true,
            currentApprover: true,
            approvalHistory: {
              include: {
                approver: true
              },
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { addendumNumber: 'asc' }
        },
        project: true
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Debug logging removed

    return NextResponse.json({
      success: true,
      parentContract: contract,
      addendums: contract.addendums
    });

  } catch (error) {
    console.error('Error fetching addendums:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST - Create a new addendum
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
    const body = await request.json();
    const {
      description,
      contractType,
      counterparty,
      value,
      currency,
      startDate,
      endDate,
      effectiveDate,
      expirationDate
    } = body;

    // Get the parent contract
    const parentContract = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: true,
        addendums: {
          orderBy: { addendumNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!parentContract) {
      return NextResponse.json({ error: 'Parent contract not found' }, { status: 404 });
    }

    // Check if parent contract is completed or signed
    if (!['COMPLETED', 'SIGNED'].includes(parentContract.contractStatus)) {
      return NextResponse.json({ 
        error: 'Addendums can only be created for completed or signed contracts' 
      }, { status: 400 });
    }

    // Calculate next addendum number
    const nextAddendumNumber = parentContract.addendums.length > 0 
      ? (parentContract.addendums[0].addendumNumber || 0) + 1 
      : 1;

    // Generate addendum contract number
    const addendumContractNumber = parentContract.contractNumber 
      ? `${parentContract.contractNumber}-${nextAddendumNumber.toString().padStart(3, '0')}`
      : `ADD-${Date.now()}-${nextAddendumNumber.toString().padStart(3, '0')}`;

    // Addendum should inherit the same document number as the parent contract
    const documentNumber = parentContract.project?.documentNumber || null;

    // Create the addendum project
    const addendumProject = await prisma.project.create({
      data: {
        name: addendumContractNumber,
        description: description || `Addendum ${nextAddendumNumber} to contract ${parentContract.contractNumber}`,
        projectType: 'CONTRACT',
        status: 'ACTIVE',
        ownerId: session.user.id,
        departments: parentContract.project?.departments || [],
        documentTemplateId: parentContract.project?.documentTemplateId,
        documentNumber
      }
    });

    // Create the addendum contract details
    const addendumContract = await prisma.contractDetails.create({
      data: {
        contractNumber: addendumContractNumber,
        contractTitle: addendumContractNumber,
        contractType: contractType || parentContract.contractType,
        contractStatus: 'DRAFT',
        counterparty: counterparty || parentContract.counterparty,
        value: value ? parseFloat(value) : parentContract.value,
        currency: currency || parentContract.currency,
        startDate: startDate ? new Date(startDate) : parentContract.startDate,
        endDate: endDate ? new Date(endDate) : parentContract.endDate,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : parentContract.effectiveDate,
        expirationDate: expirationDate ? new Date(expirationDate) : parentContract.expirationDate,
        totalApprovalLevels: parentContract.totalApprovalLevels,
        currentApprovalLevel: 1,
        currentApproverId: session.user.id,
        projectId: addendumProject.id,
        parentContractId: id,
        addendumNumber: nextAddendumNumber,
        isAddendum: true
      }
    });

    // Create initial document for the addendum
    await prisma.document.create({
      data: {
        fileName: `addendum-${addendumContractNumber}.html`,
        filePath: `/contracts/${addendumContract.id}`,
        fileType: 'html',
        size: 0,
        metadata: {
          contractId: addendumContract.id,
          contractNumber: addendumContractNumber,
          documentType: 'ADDENDUM',
          parentContractId: id
        },
        title: `Addendum ${nextAddendumNumber} - ${parentContract.contractNumber}`,
        content: `<h1>Addendum ${nextAddendumNumber}</h1><p>This addendum modifies the original contract ${parentContract.contractNumber}.</p><p>${description || 'Addendum details to be specified.'}</p>`,
        documentType: 'CONTRACT',
        ownerId: session.user.id,
        lastUpdatedById: session.user.id,
        contractDetails: {
          connect: { id: addendumContract.id }
        }
      }
    });

    // Note: Addendum inherits parent's document number, no new document number record needed

    return NextResponse.json({
      success: true,
      addendum: {
        ...addendumContract,
        project: addendumProject
      }
    });

  } catch (error) {
    console.error('Error creating addendum:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
