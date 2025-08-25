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

    console.log('🔍 Debug: Looking for finalized document for contract ID:', id);

    // Get contract details
    const contractDetails = await prisma.contractDetails.findUnique({
      where: { id },
      include: { 
        document: true,
        project: true
      }
    });

    if (!contractDetails) {
      console.log('❌ Contract not found:', id);
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get the finalized document
    const finalizedDoc = await prisma.finalizedDocument.findFirst({
      where: { 
        OR: [
          { contractNumber: contractDetails.contractNumber },
          { originalDocumentId: contractDetails.documentId }
        ]
      }
    });

    if (!finalizedDoc) {
      console.log('❌ Finalized document not found for contract:', id);
      return NextResponse.json({ error: 'Finalized document not found' }, { status: 404 });
    }

    // Return debug information
    return NextResponse.json({
      success: true,
      contractDetails: {
        id: contractDetails.id,
        contractNumber: contractDetails.contractNumber,
        contractStatus: contractDetails.contractStatus,
        counterparty: contractDetails.counterparty,
        value: contractDetails.value,
        currency: contractDetails.currency,
        documentId: contractDetails.documentId
      },
      document: contractDetails.document ? {
        id: contractDetails.document.id,
        title: contractDetails.document.title,
        contentLength: contractDetails.document.content?.length || 0,
        contentPreview: contractDetails.document.content?.substring(0, 500),
        hasContent: !!contractDetails.document.content
      } : null,
      finalizedDocument: {
        id: finalizedDoc.id,
        title: finalizedDoc.title,
        finalizedContentLength: finalizedDoc.finalizedContent?.length || 0,
        finalizedContentPreview: finalizedDoc.finalizedContent?.substring(0, 500),
        finalizedHtmlLength: finalizedDoc.finalizedHtml?.length || 0,
        finalizedHtmlPreview: finalizedDoc.finalizedHtml?.substring(0, 500),
        hasFinalizedContent: !!finalizedDoc.finalizedContent,
        hasFinalizedHtml: !!finalizedDoc.finalizedHtml,
        hasFinalizedPdf: !!finalizedDoc.finalizedPdf,
        contractNumber: finalizedDoc.contractNumber,
        version: finalizedDoc.version,
        revisionNumber: finalizedDoc.revisionNumber
      }
    });

  } catch (error) {
    console.error('Error debugging finalized document:', error);
    return NextResponse.json(
      { error: 'Failed to debug finalized document' },
      { status: 500 }
    );
  }
}
