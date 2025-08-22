import jsPDF from 'jspdf';

export interface PDFGenerationOptions {
  title?: string;
  content: string;
  contractNumber?: string;
  counterparty?: string;
  value?: string;
  currency?: string;
  contractStatus?: string;
  approvedBy?: string[];
  approvedAt?: Date;
}

export async function generateContractPDF(options: PDFGenerationOptions): Promise<Buffer> {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    let yPosition = margin;

    // Add header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRACT DOCUMENT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Add contract details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    if (options.contractNumber) {
      doc.text(`Contract Number: ${options.contractNumber}`, margin, yPosition);
      yPosition += 8;
    }
    
    if (options.counterparty) {
      doc.text(`Counterparty: ${options.counterparty}`, margin, yPosition);
      yPosition += 8;
    }
    
    if (options.value && options.currency) {
      doc.text(`Value: ${options.value} ${options.currency}`, margin, yPosition);
      yPosition += 8;
    }
    
    if (options.contractStatus) {
      doc.text(`Status: ${options.contractStatus}`, margin, yPosition);
      yPosition += 8;
    }
    
    if (options.approvedBy && options.approvedAt) {
      doc.text(`Approved By: ${options.approvedBy.join(', ')}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Approved At: ${options.approvedAt.toLocaleDateString()}`, margin, yPosition);
      yPosition += 8;
    }

    yPosition += 10;

    // Add content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(options.content, contentWidth);
    
    for (const line of lines) {
      // Check if we need a new page
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(line, margin, yPosition);
      yPosition += 6;
    }

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
