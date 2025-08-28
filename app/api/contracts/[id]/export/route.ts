import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { sections, format = 'pdf' } = await request.json();

    // Validate sections parameter
    const validSections = ['header', 'contract', 'security', 'audit'];
    const requestedSections = Array.isArray(sections) ? sections : validSections;
    
    // Ensure only valid sections are included
    const sectionsToInclude = requestedSections.filter(section => validSections.includes(section));
    
    if (sectionsToInclude.length === 0) {
      return NextResponse.json({ error: 'No valid sections specified' }, { status: 400 });
    }



    // Get contract details with all related data
    const contractDetails = await prisma.contractDetails.findUnique({
      where: { id },
      include: { 
        document: true,
        project: true,
        currentApprover: true,
        approvalHistory: {
          include: { approver: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!contractDetails) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get finalized document if it exists
    const finalizedDoc = await prisma.finalizedDocument.findFirst({
      where: { 
        OR: [
          { contractNumber: contractDetails.contractNumber },
          { originalDocumentId: contractDetails.documentId }
        ]
      }
    });

    // Get contract revisions for audit trail
    const revisions = await prisma.contractRevision.findMany({
      where: { contractId: contractDetails.id },
      include: { creator: true },
      orderBy: { createdAt: 'desc' }
    });

    // Generate the modular PDF/document
    const { ModularContractGenerator } = await import('@/lib/modular-contract-generator');
    const generator = new ModularContractGenerator();
    
    const exportData = {
      contractDetails,
      finalizedDoc,
      revisions,
      content: finalizedDoc?.finalizedContent || contractDetails.document?.content || '',
      sections: sectionsToInclude,
      format
    };

    let resultBuffer: Buffer;
    let contentType: string;
    let filename: string;

    if (format === 'pdf') {
      resultBuffer = await generator.generateModularPDF(exportData);
      contentType = 'application/pdf';
      filename = `${contractDetails.contractNumber || 'contract'}-${sectionsToInclude.join('-')}.pdf`;
    } else if (format === 'html') {
      const htmlContent = await generator.generateModularHTML(exportData);
      resultBuffer = Buffer.from(htmlContent, 'utf-8');
      contentType = 'text/html';
      filename = `${contractDetails.contractNumber || 'contract'}-${sectionsToInclude.join('-')}.html`;
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    // Clean up browser instance
    await generator.closeBrowser();

    // Return the file
    return new NextResponse(resultBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': resultBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error exporting contract:', error);
    return NextResponse.json(
      { error: 'Failed to export contract' },
      { status: 500 }
    );
  }
}
