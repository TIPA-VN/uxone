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

    // Get contract details
    const contractDetails = await prisma.contractDetails.findUnique({
      where: { id },
      include: { project: true, document: true }
    });

    if (!contractDetails) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if finalized document exists
    const finalizedDocument = await prisma.finalizedDocument.findFirst({
      where: { 
        OR: [
          { originalDocumentId: contractDetails.documentId },
          { contractNumber: contractDetails.contractNumber }
        ]
      }
    });

    // Get all finalized documents for this contract (for debugging)
    const allFinalizedDocs = await prisma.finalizedDocument.findMany({
      where: { 
        OR: [
          { originalDocumentId: contractDetails.documentId },
          { contractNumber: contractDetails.contractNumber }
        ]
      }
    });

    return NextResponse.json({
      success: true,
      contractDetails: {
        id: contractDetails.id,
        contractNumber: contractDetails.contractNumber,
        contractStatus: contractDetails.contractStatus,
        currentApprovalLevel: contractDetails.currentApprovalLevel,
        totalApprovalLevels: contractDetails.totalApprovalLevels,
        hasDocument: !!contractDetails.documentId,
        documentId: contractDetails.documentId
      },
      finalizedDocument: finalizedDocument || null,
      allFinalizedDocs: allFinalizedDocs,
      debug: {
        isReadyForFinalization: 
          contractDetails.currentApprovalLevel >= contractDetails.totalApprovalLevels,
        approvalProgress: `${contractDetails.currentApprovalLevel}/${contractDetails.totalApprovalLevels}`,
        hasDocument: !!contractDetails.documentId,
        documentContent: contractDetails.document?.content ? 
          `${contractDetails.document.content.length} characters` : 'No content'
      }
    });

  } catch (error) {
    console.error('Error checking finalized document:', error);
    return NextResponse.json(
      { error: 'Failed to check finalized document' },
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

    switch (action) {
      case 'DOWNLOAD_PDF':
        // Download finalized PDF
        const finalizedDoc = await prisma.finalizedDocument.findFirst({
          where: { 
            OR: [
              { originalDocumentId: id },
              { contractNumber: id }
            ]
          }
        });

        if (!finalizedDoc) {
          return NextResponse.json({ error: 'Finalized document not found' }, { status: 404 });
        }

        // Return PDF data
        return NextResponse.json({
          success: true,
          pdf: finalizedDoc.finalizedPdf,
          filename: `${finalizedDoc.contractNumber || 'contract'}.pdf`
        });

      case 'VERIFY_SIGNATURE':
        // Verify digital signature
        const docToVerify = await prisma.finalizedDocument.findFirst({
          where: { 
            OR: [
              { originalDocumentId: id },
              { contractNumber: id }
            ]
          }
        });

        if (!docToVerify) {
          return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Basic signature verification
        const signature = JSON.parse(docToVerify.digitalSignature || '{}');
        const isValid = signature.signature && signature.hash;

        return NextResponse.json({
          success: true,
          isValid,
          signature: signature,
          checksum: docToVerify.checksum
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
