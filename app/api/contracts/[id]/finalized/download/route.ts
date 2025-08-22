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

    console.log('🔍 Looking for finalized document for contract ID:', id);

    // First, get the contract details to get the proper identifiers
    const contractDetails = await prisma.contractDetails.findUnique({
      where: { id },
      include: { document: true }
    });

    if (!contractDetails) {
      console.log('❌ Contract not found:', id);
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    console.log('📄 Contract found:', {
      contractId: contractDetails.id,
      contractNumber: contractDetails.contractNumber,
      documentId: contractDetails.documentId
    });

    // Get the finalized document using the contract's identifiers
    const finalizedDoc = await prisma.finalizedDocument.findFirst({
      where: { 
        OR: [
          { contractNumber: contractDetails.contractNumber },
          { originalDocumentId: contractDetails.documentId }
        ]
      }
    });

    console.log('📄 Finalized document search result:', {
      found: !!finalizedDoc,
      finalizedDocId: finalizedDoc?.id,
      searchCriteria: {
        contractNumber: contractDetails.contractNumber,
        originalDocumentId: contractDetails.documentId
      }
    });

    if (!finalizedDoc) {
      return NextResponse.json({ error: 'Finalized document not found' }, { status: 404 });
    }

    // Generate the PDF on-demand if it doesn't exist
    let pdfBuffer: Buffer;
    if (finalizedDoc.finalizedPdf) {
      // Use stored PDF if available
      console.log('📄 Using stored PDF, length:', finalizedDoc.finalizedPdf.length);
      console.log('📄 PDF data preview:', finalizedDoc.finalizedPdf.substring(0, 100));
      
      try {
        // Remove data URL prefix if present
        let base64Data = finalizedDoc.finalizedPdf;
        if (base64Data.startsWith('data:')) {
          const base64Index = base64Data.indexOf('base64,');
          if (base64Index !== -1) {
            base64Data = base64Data.substring(base64Index + 7); // Remove "base64," prefix
            console.log('📄 Stripped data URL prefix, new length:', base64Data.length);
          }
        }
        
        pdfBuffer = Buffer.from(base64Data, 'base64');
        console.log('📄 PDF buffer created, size:', pdfBuffer.length);
      } catch (decodeError) {
        console.error('❌ Error decoding PDF from base64:', decodeError);
        // Fall back to regenerating the PDF
        finalizedDoc.finalizedPdf = null;
      }
    }
    
    if (!pdfBuffer && contractDetails.document?.content) {
      // Generate PDF from document content
      const { generateContractPDF } = await import('@/lib/pdf-generator');
      pdfBuffer = await generateContractPDF(contractDetails);
      
      // Update the finalized document with the generated PDF
      await prisma.finalizedDocument.update({
        where: { id: finalizedDoc.id },
        data: {
          finalizedPdf: pdfBuffer.toString('base64')
        }
      });
    } else {
      return NextResponse.json({ error: 'No document content available' }, { status: 404 });
    }

    // Return the PDF file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${finalizedDoc.title || 'contract.pdf'}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error downloading finalized document:', error);
    return NextResponse.json(
      { error: 'Failed to download finalized document' },
      { status: 500 }
    );
  }
}
