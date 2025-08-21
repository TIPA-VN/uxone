import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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

    // Get the contract details
    const contractDetails = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: true,
        document: true,
        finalizedDocument: true
      }
    });

    if (!contractDetails) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if user has access to this contract
    const isOwner = contractDetails.project?.ownerId === session.user.id;
    const isManager = ["MANAGER", "SENIOR_MANAGER", "GENERAL_MANAGER", "ADMIN"].includes(session.user.role || "");
    
    if (!isOwner && !isManager) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Return finalized document if it exists
    if (contractDetails.finalizedDocument) {
      return NextResponse.json({
        success: true,
        finalizedDocument: contractDetails.finalizedDocument
      });
    }

    // Return contract details if not yet finalized
    return NextResponse.json({
      success: true,
      finalizedDocument: null,
      contract: contractDetails
    });

  } catch (error) {
    console.error('Error fetching finalized document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finalized document' },
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
    const { action } = await request.json();

    // Get the contract details
    const contractDetails = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: true,
        document: true,
        finalizedDocument: true
      }
    });

    if (!contractDetails) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if user has access to this contract
    const isOwner = contractDetails.project?.ownerId === session.user.id;
    const isManager = ["MANAGER", "SENIOR_MANAGER", "GENERAL_MANAGER", "ADMIN"].includes(session.user.role || "");
    
    if (!isOwner && !isManager) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    switch (action) {
      case 'DOWNLOAD_PDF':
        if (!contractDetails.finalizedDocument?.finalizedPdf) {
          return NextResponse.json({ error: 'PDF not available' }, { status: 404 });
        }
        
        return NextResponse.json({
          success: true,
          pdf: contractDetails.finalizedDocument.finalizedPdf
        });

      case 'VERIFY_SIGNATURE':
        if (!contractDetails.finalizedDocument?.digitalSignature) {
          return NextResponse.json({ error: 'Digital signature not available' }, { status: 404 });
        }
        
        try {
          const signature = JSON.parse(contractDetails.finalizedDocument.digitalSignature);
          return NextResponse.json({
            success: true,
            signature,
            verified: true
          });
        } catch (error) {
          return NextResponse.json({
            success: true,
            signature: null,
            verified: false
          });
        }

      case 'GET_METADATA':
        return NextResponse.json({
          success: true,
          metadata: {
            contractNumber: contractDetails.contractNumber,
            contractType: contractDetails.contractType,
            counterparty: contractDetails.counterparty,
            value: contractDetails.value,
            currency: contractDetails.currency,
            contractStatus: contractDetails.contractStatus,
            approvedAt: contractDetails.finalizedDocument?.approvedAt,
            approvedBy: contractDetails.finalizedDocument?.approvedBy,
            checksum: contractDetails.finalizedDocument?.checksum,
            isLegallyBinding: contractDetails.finalizedDocument?.isLegallyBinding
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing finalized document action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
