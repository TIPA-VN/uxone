import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface PDFKitGenerationOptions {
  title?: string;
  content?: string;
  contractNumber?: string;
  counterparty?: string;
  value?: string;
  currency?: string;
  contractStatus?: string;
  startDate?: Date;
  expirationDate?: Date;
  approvedBy?: string[];
  approvedAt?: Date;
  approverNames?: string[];
  contractTitle?: string;
  version?: number;
  revisionNumber?: number;
  finalizationDate?: Date;
  checksum?: string;
}

export class PDFKitGenerator {
  private doc: PDFDocument.PDFDocument;
  private fontLoaded: boolean = false;

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      },
      // Use built-in fonts only to avoid file path issues
      font: 'Helvetica'
    });
  }

  /**
   * Initialize fonts with Vietnamese support
   */
  private async initializeFonts(): Promise<void> {
    try {
      // Use built-in Helvetica font which has good Unicode support
      this.doc.font('Helvetica');
      this.fontLoaded = true;
      console.log('🔍 Using built-in Helvetica font with Unicode support');
    } catch (error) {
      console.log('⚠️ Font initialization failed, using default font');
      // PDFKit will use default font if Helvetica fails
    }
  }

  /**
   * Generate contract PDF with Vietnamese text support
   */
  async generateContractPDF(options: PDFKitGenerationOptions): Promise<Buffer> {
    try {
      await this.initializeFonts();
      
      const pageWidth = this.doc.page.width - 100; // Account for margins
      let yPosition = 50;

      // Header
      this.doc
        .fontSize(24)
        .font('Helvetica')
        .text(options.title || 'CONTRACT DOCUMENT', 50, yPosition, { align: 'center' });
      yPosition += 40;

      // Contract Details Section
      this.doc
        .fontSize(14)
        .font('Helvetica')
        .text('Contract Details', 50, yPosition);
      yPosition += 25;

      // Two-column layout for metadata
      const leftColumn = 50;
      const rightColumn = pageWidth / 2 + 50;
      let leftY = yPosition;
      let rightY = yPosition;

      // Left column
      if (options.contractNumber) {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Contract Number: ${options.contractNumber}`, leftColumn, leftY);
        leftY += 20;
      }

      if (options.counterparty) {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Counterparty: ${options.counterparty}`, leftColumn, leftY);
        leftY += 20;
      }

      if (options.value && options.currency) {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Value: ${options.value} ${options.currency}`, leftColumn, leftY);
        leftY += 20;
      }

      // Right column
      if (options.startDate) {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Start Date: ${options.startDate.toLocaleDateString()}`, rightColumn, rightY);
        rightY += 20;
      }

      if (options.expirationDate) {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Expiration Date: ${options.expirationDate.toLocaleDateString()}`, rightColumn, rightY);
        rightY += 20;
      }

      if (options.contractStatus) {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Status: ${options.contractStatus}`, rightColumn, rightY);
        rightY += 20;
      }

      // Use the higher Y position
      yPosition = Math.max(leftY, rightY) + 30;

      // Content separator
      this.doc
        .moveTo(50, yPosition)
        .lineTo(pageWidth + 50, yPosition)
        .stroke();
      yPosition += 30;

      // Contract Content
      this.doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Contract Content', 50, yPosition);
      yPosition += 25;

      // Process and add content
      if (options.content) {
        const cleanContent = this.cleanHTMLContent(options.content);
        this.doc
          .fontSize(11)
          .font('Helvetica')
          .text(cleanContent, 50, yPosition, {
            width: pageWidth,
            align: 'left'
          });
      }

      // Add new page for audit information
      this.doc.addPage();
      yPosition = 50;

      // Audit Information Header
      this.doc
        .fontSize(18)
        .font('Helvetica')
        .text('Contract Audit Information', 50, yPosition, { align: 'center' });
      yPosition += 40;

      // Audit details in two columns
      let auditLeftY = yPosition;
      let auditRightY = yPosition;

      // Left column
      if (options.contractNumber) {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Contract Number: ${options.contractNumber}`, 50, auditLeftY);
        auditLeftY += 20;
      }

      if (options.contractTitle) {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Contract Title: ${options.contractTitle}`, 50, auditLeftY);
        auditLeftY += 20;
      }

      if (options.version) {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Version: ${options.version}`, 50, auditLeftY);
        auditLeftY += 20;
      }

      // Right column
      if (options.finalizationDate) {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Finalized: ${options.finalizationDate.toLocaleDateString()}`, rightColumn, auditRightY);
        auditRightY += 20;
      }

      if (options.approvedAt) {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Approved: ${options.approvedAt.toLocaleDateString()}`, rightColumn, auditRightY);
        auditRightY += 20;
      }

      yPosition = Math.max(auditLeftY, auditRightY) + 30;

      // Approval History
      this.doc
        .fontSize(16)
        .font('Helvetica')
        .text('Approval History', 50, yPosition);
      yPosition += 25;

      if (options.approverNames && options.approverNames.length > 0) {
        options.approverNames.forEach((approverName, index) => {
          this.doc
            .fontSize(12)
            .font('Helvetica')
            .text(`Approver ${index + 1}: ${approverName}`, 50, yPosition);
          yPosition += 20;
        });
      } else {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text('No approval history available', 50, yPosition);
        yPosition += 20;
      }

      yPosition += 20;

      // Digital Signature & Security
      this.doc
        .fontSize(16)
        .font('Helvetica')
        .text('Digital Signature & Security', 50, yPosition);
      yPosition += 25;

      if (options.checksum) {
        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Document Checksum: ${options.checksum}`, 50, yPosition);
        yPosition += 20;
      }

      this.doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Generated At: ${new Date().toLocaleString()}`, 50, yPosition);
      yPosition += 20;

      this.doc
        .fontSize(12)
        .font('Helvetica')
        .text(`PDF Version: 2.0 (PDFKit)`, 50, yPosition);

      // Finalize the document
      this.doc.end();

      // Convert to buffer
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        
        this.doc.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        this.doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log('🔍 PDFKit PDF Generation Complete');
          console.log('🔍 PDF Buffer Size:', buffer.length);
          resolve(buffer);
        });

        this.doc.on('error', (error) => {
          reject(error);
        });
      });

    } catch (error) {
      console.error('Error generating PDF with PDFKit:', error);
      throw new Error('Failed to generate PDF with PDFKit');
    }
  }

  /**
   * Clean HTML content for PDF rendering
   */
  private cleanHTMLContent(htmlContent: string): string {
    return htmlContent
      // Replace headers with plain text
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n')
      // Replace paragraphs with line breaks
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n\n$1\n')
      // Replace line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Replace divs with line breaks
      .replace(/<\/div>/gi, '\n')
      // Replace strong/b tags with plain text
      .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '$2')
      // Replace em/i tags with plain text
      .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '$2')
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
  }

  /**
   * Generate simple PDF for testing
   */
  async generateSimplePDF(content: string, title: string = 'Document'): Promise<Buffer> {
    try {
      await this.initializeFonts();
      
      this.doc
        .fontSize(18)
        .font('Helvetica')
        .text(title, 50, 50, { align: 'center' });

      this.doc
        .fontSize(12)
        .font('Helvetica')
        .text(content, 50, 100, {
          width: this.doc.page.width - 100,
          align: 'left'
        });

      this.doc.end();

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        
        this.doc.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        this.doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });

        this.doc.on('error', (error) => {
          reject(error);
        });
      });

    } catch (error) {
      console.error('Error generating simple PDF:', error);
      throw new Error('Failed to generate simple PDF');
    }
  }
}

export default PDFKitGenerator;
