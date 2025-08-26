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
      include: { 
        document: true,
        project: true
      }
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

    console.log('📄 Found finalized document:', finalizedDoc.id);
    console.log('📄 Finalized document details:', {
      title: finalizedDoc.title,
      finalizedContentLength: finalizedDoc.finalizedContent?.length || 0,
      finalizedContentPreview: finalizedDoc.finalizedContent?.substring(0, 500),
      hasFinalizedContent: !!finalizedDoc.finalizedContent,
      hasFinalizedHtml: !!finalizedDoc.finalizedHtml
    });

    // Generate the PDF on-demand if it doesn't exist
    let pdfBuffer: Buffer;
    
    // FORCE REGENERATION: Always generate new PDF when content is available
    if (finalizedDoc.finalizedContent || contractDetails.document?.content) {
      console.log('📄 Content available, forcing PDF regeneration...');
      
      // Generate PDF from finalized document content or fallback to original content
      const { PuppeteerGenerator } = await import('@/lib/puppeteer-generator');
      let content = finalizedDoc.finalizedContent || contractDetails.document?.content || '';
      
      // If content is still empty, use a fallback
      if (!content || content.trim().length === 0) {
        content = 'Contract content not available. Please check the database.';
      }
      
      console.log('📄 Generating PDF with content length:', content.length);
      
      // Fetch user information for approvers to display names in PDF
      const approverUsers = await prisma.user.findMany({
        where: {
          id: {
            in: finalizedDoc.approvedBy || []
          }
        },
        select: {
          id: true,
          name: true,
          username: true
        }
      });

      // Create array of approver names
      const approverNames = (finalizedDoc.approvedBy || []).map(approverId => {
        const user = approverUsers.find(u => u.id === approverId);
        // FORCE use database data - no fallbacks to prevent corruption
        let approverName = user?.name;
        
        // If no name, use username but clean it
        if (!approverName) {
          approverName = user?.username || approverId;
        }
        
        // Ensure we have clean text
        if (typeof approverName === 'string') {
          // Remove any potential encoding artifacts
          approverName = approverName.replace(/[^\x00-\x7F\u00A0-\uFFFF]/g, '');
        }
        console.log('🔍 API Route - Approver data (DIRECT DB):', { 
          approverId, 
          userName: user?.name, 
          username: user?.username, 
          finalName: approverName,
          nameType: typeof user?.name,
          usernameType: typeof user?.username,
          source: 'database'
        });
        return approverName;
      });

      console.log('🔍 About to call Puppeteer PDF generation with approverNames:', approverNames);
      console.log('🔍 Contract date fields:', {
        startDate: contractDetails.startDate,
        effectiveDate: contractDetails.effectiveDate,
        expirationDate: contractDetails.expirationDate,
        endDate: contractDetails.endDate,
        source: 'ContractDetails model'
      });
      console.log('🔍 Data source verification:', {
        approverNamesFromDB: approverNames,
        approvedByFromDoc: finalizedDoc.approvedBy,
        source: 'API Route - FORCED CLEAN Database Query'
      });
      
      // Create Puppeteer generator instance
      const pdfGenerator = new PuppeteerGenerator();
      
      pdfBuffer = await pdfGenerator.generateContractPDF({
        title: finalizedDoc.title || contractDetails.document?.title || 'Contract Document',
        content: content,
        contractNumber: finalizedDoc.contractNumber || contractDetails.contractNumber,
        contractTitle: contractDetails.contractTitle || contractDetails.document?.title || 'Contract Document',
        counterparty: contractDetails.counterparty,
        value: contractDetails.value?.toString(),
        currency: contractDetails.currency,
        contractStatus: contractDetails.contractStatus,
        startDate: contractDetails.startDate || contractDetails.effectiveDate || null,
        expirationDate: contractDetails.expirationDate || contractDetails.endDate || null,
        approvedBy: finalizedDoc.approvedBy || [],
        approverNames: approverNames,
        finalizationDate: finalizedDoc.finalizationDate || new Date(),
        version: finalizedDoc.version || 1,
        revisionNumber: finalizedDoc.revisionNumber || 1,
        checksum: finalizedDoc.checksum || 'N/A'
      });
      
      // Clean up browser instance
      await pdfGenerator.closeBrowser();
      
      console.log('📄 PDF generated successfully, size:', pdfBuffer.length);
      
      // Update the finalized document with the generated PDF
      await prisma.finalizedDocument.update({
        where: { id: finalizedDoc.id },
        data: {
          finalizedPdf: pdfBuffer.toString('base64')
        }
      });
    } else if (finalizedDoc.finalizedPdf) {
      // Only use stored PDF if no content is available (fallback)
      console.log('📄 No content available, using stored PDF as fallback, length:', finalizedDoc.finalizedPdf.length);
      
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
        pdfBuffer = null;
      }
    }
    
    if (!pdfBuffer) {
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
