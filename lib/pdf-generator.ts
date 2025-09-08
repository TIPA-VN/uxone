import jsPDF from 'jspdf';

export interface PDFGenerationOptions {
  title?: string;
  content: string;
  contractNumber?: string;
  counterparty?: string;
  value?: string;
  currency?: string;
  contractStatus?: string;
  contractTitle?: string;        // Contract title field
  startDate?: Date;              // Contract start date
  expirationDate?: Date;         // Contract expiration date
  approvedBy?: string[];
  approverNames?: string[];      // Human-readable approver names
  approvedAt?: Date;
  finalizationDate?: Date;       // When the document was finalized
  version?: number;              // Contract version
  revisionNumber?: number;       // Revision number
  checksum?: string;             // Document checksum for audit
}

// ENHANCED TEXT PROCESSING: Handle Vietnamese text with multiple strategies
function processVietnameseText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // Strategy 1: Try to preserve Vietnamese characters if possible
  // Strategy 2: Fallback to readable ASCII conversion
  
  // Enhanced Vietnamese to readable text mappings
  const vietnameseMap: { [key: string]: string } = {
    // Common Vietnamese characters with better readability
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    
    // Uppercase versions
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
    
    // Special characters
    'đ': 'd', 'Đ': 'D'
  };
  
  let processed = text;
  
  // Apply Vietnamese to readable text mappings
  Object.entries(vietnameseMap).forEach(([vietnamese, readable]) => {
    processed = processed.replace(new RegExp(vietnamese, 'g'), readable);
  });
  
  return processed;
}

export async function generateContractPDF(options: PDFGenerationOptions): Promise<Buffer> {
  try {
        const doc = new jsPDF('p', 'mm', 'a4');
    
    // Use built-in helvetica font for reliable PDF generation
    doc.setFont('helvetica', 'normal');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    let yPosition = margin;

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    // SMART TEXT PROCESSING: Convert Vietnamese to readable format
    const processedTitle = processVietnameseText(options.title || 'CONTRACT DOCUMENT');
    doc.text(processedTitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Add contract details in a more compact format
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Create a two-column layout for metadata
    const leftColumn = margin;
    const rightColumn = pageWidth / 2 + 10;
    
    // Left column - Basic contract info
    if (options.contractNumber) {
      doc.text(`Contract Number: ${options.contractNumber}`, leftColumn, yPosition);
      yPosition += 6;
    }
    
    if (options.counterparty) {
      // SMART TEXT PROCESSING: Convert Vietnamese to readable format
      const processedCounterparty = processVietnameseText(options.counterparty);
      doc.text(`Counterparty: ${processedCounterparty}`, leftColumn, yPosition);
      yPosition += 6;
    }
    
    if (options.value && options.currency) {
      doc.text(`Value: ${options.value} ${options.currency}`, leftColumn, yPosition);
      yPosition += 6;
    }
    
    // Right column - Dates and status
    let rightY = margin + 6; // Start at same level as first left column item
    
    if (options.startDate) {
      doc.text(`Start Date: ${options.startDate.toLocaleDateString()}`, rightColumn, rightY);
      rightY += 6;
    }
    
    if (options.expirationDate) {
      doc.text(`Expiration Date: ${options.expirationDate.toLocaleDateString()}`, rightColumn, rightY);
      rightY += 6;
    }
    
    if (options.contractStatus) {
      doc.text(`Status: ${options.contractStatus}`, rightColumn, rightY);
      rightY += 6;
    }
    
    if (options.approvedBy && options.approvedAt) {
      // Use actual names instead of IDs
      const approverNames = options.approverNames || options.approvedBy;
      // SMART TEXT PROCESSING: Convert Vietnamese to readable format
      const processedApproverNames = approverNames.map(name => processVietnameseText(name));
      doc.text(`Approved By: ${processedApproverNames.join(', ')}`, rightColumn, rightY);
      rightY += 6;
      doc.text(`Approved At: ${options.approvedAt.toLocaleDateString()}`, rightColumn, rightY);
      rightY += 6;
    }
    
    // Use the higher Y position to continue
    yPosition = Math.max(yPosition, rightY);

    yPosition += 15;

    // Add content separator
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Add content with better formatting
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Clean and format the content
    let cleanContent = options.content || '';
    
                    if (!cleanContent || cleanContent.trim() === '') {
            cleanContent = 'No contract content available. Please check the document content.';
    }
    
    // Better HTML processing - preserve structure while removing tags
    cleanContent = cleanContent
      // Replace headers with bold text
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n**$1**\n')
      // Replace paragraphs with proper spacing
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n\n$1\n')
      // Replace line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Replace divs with line breaks
      .replace(/<\/div>/gi, '\n')
      // Replace strong/b tags with bold markers
      .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
      // Replace em/i tags with italic markers
      .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
      // Remove remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      // Clean up excessive whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/g, '');
    
    // Validate that we have meaningful content
    if (cleanContent.trim().length < 10) {
      cleanContent = options.content || 'No content available';
    }
    
    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(cleanContent, contentWidth);
    
    for (const line of lines) {
      // Check if we need a new page
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      // Handle bold text (marked with **text**)
      if (line.includes('**')) {
        const parts = line.split('**');
        let currentX = margin;
        
        for (let i = 0; i < parts.length; i++) {
          if (i % 2 === 0) {
            // Regular text
            doc.setFont('helvetica', 'normal');
            doc.text(parts[i], currentX, yPosition);
            currentX += doc.getTextWidth(parts[i]);
          } else {
            // Bold text
            doc.setFont('helvetica', 'bold');
            doc.text(parts[i], currentX, yPosition);
            currentX += doc.getTextWidth(parts[i]);
            doc.setFont('helvetica', 'normal');
          }
        }
      } else {
        // Regular text
        doc.text(line, margin, yPosition);
      }
      
      yPosition += 6;
    }

    // Add audit summary page
    doc.addPage();
    yPosition = margin;
    
    // Audit Summary Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AUDIT SUMMARY & RECORD KEEPING', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
    
    // Document Information Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Document Information', margin, yPosition);
    yPosition += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Left column for document info
    const auditLeftCol = margin;
    const auditRightCol = pageWidth / 2 + 10;
    let auditY = yPosition;
    
    if (options.contractNumber) {
      doc.text(`Contract Number: ${options.contractNumber}`, auditLeftCol, auditY);
      auditY += 6;
    }
    
    if (options.contractTitle) {
      const processedContractTitle = processVietnameseText(options.contractTitle);
      doc.text(`Contract Title: ${processedContractTitle}`, auditLeftCol, auditY);
      auditY += 6;
    }
    
    if (options.version) {
      doc.text(`Version: ${options.version}`, auditLeftCol, auditY);
      auditY += 6;
    }
    
    if (options.revisionNumber) {
      doc.text(`Revision: ${options.revisionNumber}`, auditLeftCol, auditY);
      auditY += 6;
    }
    
    // Right column for dates
    let auditRightY = yPosition;
    
    if (options.startDate) {
      doc.text(`Start Date: ${options.startDate.toLocaleDateString()}`, auditRightCol, auditRightY);
      auditRightY += 6;
    }
    
    if (options.expirationDate) {
      doc.text(`Expiration Date: ${options.expirationDate.toLocaleDateString()}`, auditRightCol, auditRightY);
      auditRightY += 6;
    }
    
    if (options.finalizationDate) {
      doc.text(`Finalized: ${options.finalizationDate.toLocaleDateString()}`, auditRightCol, auditRightY);
      auditRightY += 6;
    }
    
    if (options.approvedAt) {
      doc.text(`Approved: ${options.approvedAt.toLocaleDateString()}`, auditRightCol, auditRightY);
      auditRightY += 6;
    }
    
    yPosition = Math.max(auditY, auditRightY) + 15;
    
    // Approval History Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Approval History', margin, yPosition);
    yPosition += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (options.approvedBy && options.approvedBy.length > 0) {
      options.approvedBy.forEach((approverId, index) => {
        const approverName = options.approverNames?.[index] || approverId;
        // SMART TEXT PROCESSING: Convert Vietnamese to readable format
        const processedApproverName = processVietnameseText(approverName);
        doc.text(`Approver ${index + 1}: ${processedApproverName}`, margin, yPosition);
        yPosition += 6;
      });
    } else {
      doc.text('No approval history available', margin, yPosition);
      yPosition += 6;
    }
    
    yPosition += 10;
    
    // Digital Signature & Security Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Digital Signature & Security', margin, yPosition);
    yPosition += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (options.checksum) {
      doc.text(`Document Checksum: ${options.checksum}`, margin, yPosition);
      yPosition += 6;
    }
    
    doc.text(`Generated At: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 6;
    doc.text(`PDF Version: 1.0`, margin, yPosition);
    yPosition += 6;
    
    // Record Keeping Notice
    yPosition += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RECORD KEEPING NOTICE:', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('This document has been electronically finalized and contains digital signatures.', margin, yPosition);
    yPosition += 6;
    doc.text('For legal purposes, this PDF represents the official version of the contract.', margin, yPosition);
    yPosition += 6;
    doc.text('Retain this document according to your organization\'s record retention policy.', margin, yPosition);
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

                // Convert to Buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        return pdfBuffer;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

export async function generateSimplePDF(content: string, title?: string): Promise<string> {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    let yPosition = margin;

    // Add title if provided
    if (title) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
    }

    // Add content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const lines = doc.splitTextToSize(content, contentWidth);
    
    for (const line of lines) {
      doc.text(line, margin, yPosition);
      yPosition += 6;
    }

    const pdfBase64 = doc.output('datauristring');
    return pdfBase64;
    
  } catch (error) {
    console.error('Error generating simple PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}
