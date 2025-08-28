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
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'html';
    const contractId = searchParams.get('contractId');

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

            // Get contract details to find the finalized document
    const contractDetails = await prisma.contractDetails.findUnique({
      where: { id: contractId },
      include: { document: true }
    });

    if (!contractDetails) {
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
            return NextResponse.json({ error: 'Finalized document not found' }, { status: 404 });
    }

            let content: string;
    let contentType: string;
    let filename: string;
    let extension: string;

    switch (format.toLowerCase()) {
      case 'html':
        content = finalizedDoc.finalizedHtml || finalizedDoc.finalizedContent;
        contentType = 'text/html';
        extension = 'html';
        break;
      
      case 'txt':
      case 'text':
        // Convert HTML to plain text - use finalizedContent since finalizedHtml is empty
        content = (finalizedDoc.finalizedContent || finalizedDoc.finalizedHtml || '')
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
          .replace(/&amp;/g, '&') // Replace &amp; with &
          .replace(/&lt;/g, '<') // Replace &lt; with <
          .replace(/&gt;/g, '>') // Replace &gt; with >
          .replace(/&quot;/g, '"') // Replace &quot; with "
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        contentType = 'text/plain';
        extension = 'txt';
        break;
      
      case 'json':
        // Export as structured JSON with metadata
        const jsonData = {
          title: finalizedDoc.title,
          contractNumber: finalizedDoc.contractNumber,
          version: finalizedDoc.version,
          revisionNumber: finalizedDoc.revisionNumber,
          content: finalizedDoc.finalizedContent,
          html: finalizedDoc.finalizedHtml,
          metadata: {
            approvedBy: finalizedDoc.approvedBy,
            approvedAt: finalizedDoc.approvedAt,
            finalizationDate: finalizedDoc.finalizationDate,
            checksum: finalizedDoc.checksum,
            digitalSignature: finalizedDoc.digitalSignature,
            isLegallyBinding: finalizedDoc.isLegallyBinding,
            storageLocation: finalizedDoc.storageLocation,
            finalizationNotes: finalizedDoc.finalizationNotes
          }
        };
        content = JSON.stringify(jsonData, null, 2);
        contentType = 'application/json';
        extension = 'json';
        break;
      
      case 'md':
      case 'markdown':
        // Convert HTML to Markdown - use finalizedContent since finalizedHtml is empty
        content = convertHtmlToMarkdown(finalizedDoc.finalizedContent || finalizedDoc.finalizedHtml || '');
        contentType = 'text/markdown';
        extension = 'md';
        break;
      
      default:
        return NextResponse.json({ error: 'Unsupported format. Use: html, txt, json, or md' }, { status: 400 });
    }

        if (!content) {
      return NextResponse.json({ error: 'Content not available in requested format' }, { status: 404 });
    }

    filename = `${finalizedDoc.title || 'contract'}.${extension}`;

        // Return the content in the requested format
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.length.toString()
      }
    });

  } catch (error) {
    console.error('Error downloading finalized document in format:', error);
    return NextResponse.json(
      { error: 'Failed to download finalized document' },
      { status: 500 }
    );
  }
}

function convertHtmlToMarkdown(html: string): string {
  if (!html) return '';
  
  return html
    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    
    // Bold and italic
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    
    // Lists
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
    })
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      let counter = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n';
    })
    
    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    
    // Paragraphs and line breaks
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    
    // Tables (basic conversion)
    .replace(/<table[^>]*>(.*?)<\/table>/gis, (match, content) => {
      const rows = content.match(/<tr[^>]*>(.*?)<\/tr>/gi) || [];
      if (rows.length === 0) return '';
      
      let markdown = '\n';
      rows.forEach((row, index) => {
        const cells = row.match(/<t[dh][^>]*>(.*?)<\/t[dh]>/gi) || [];
        if (cells.length === 0) return;
        
        const cellContent = cells.map(cell => 
          cell.replace(/<t[dh][^>]*>(.*?)<\/t[dh]>/i, '$1').trim()
        );
        
        markdown += '| ' + cellContent.join(' | ') + ' |\n';
        
        // Add separator row after header
        if (index === 0) {
          markdown += '| ' + cellContent.map(() => '---').join(' | ') + ' |\n';
        }
      });
      
      return markdown + '\n';
    })
    
    // Remove remaining HTML tags
    .replace(/<[^>]*>/g, '')
    
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}
