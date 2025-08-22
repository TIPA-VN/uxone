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

    console.log('🔍 Fetching finalized document for contract:', id);

    // Get contract details
    const contractDetails = await prisma.contractDetails.findUnique({
      where: { id },
      include: { project: true, document: true }
    });

    if (!contractDetails) {
      console.log('❌ Contract not found:', id);
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    console.log('📄 Contract details:', {
      id: contractDetails.id,
      contractNumber: contractDetails.contractNumber,
      documentId: contractDetails.documentId,
      contractStatus: contractDetails.contractStatus,
      hasDocument: !!contractDetails.document,
      hasContent: !!contractDetails.document?.content,
      contentLength: contractDetails.document?.content?.length || 0
    });

    // Check if finalized document exists
    let finalizedDocument = null;
    let allFinalizedDocs = [];
    
    try {
      // Build the where condition carefully
      const whereCondition: any = { OR: [] };
      
      if (contractDetails.contractNumber) {
        whereCondition.OR.push({ contractNumber: contractDetails.contractNumber });
      }
      
      if (contractDetails.documentId) {
        whereCondition.OR.push({ originalDocumentId: contractDetails.documentId });
      }
      
      // Only query if we have at least one condition
      if (whereCondition.OR.length > 0) {
        console.log('🔍 Querying finalized documents with condition:', whereCondition);
        
        finalizedDocument = await prisma.finalizedDocument.findFirst({
          where: whereCondition
        });

        allFinalizedDocs = await prisma.finalizedDocument.findMany({
          where: whereCondition
        });
        
        console.log('📄 Finalized document query results:', {
          found: !!finalizedDocument,
          totalFound: allFinalizedDocs.length,
          finalizedDocId: finalizedDocument?.id
        });
      } else {
        console.log('⚠️ No query conditions available - missing contractNumber and documentId');
      }
    } catch (queryError) {
      console.error('❌ Error querying finalized documents:', queryError);
      // Continue without finalized document data
    }

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
              { contractNumber: id },
              { originalDocumentId: id }
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
          filename: finalizedDoc.title || 'contract.pdf'
        });

      case 'VERIFY_SIGNATURE':
        // Verify digital signature
        const docToVerify = await prisma.finalizedDocument.findFirst({
          where: { 
            OR: [
              { contractNumber: id },
              { originalDocumentId: id }
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
