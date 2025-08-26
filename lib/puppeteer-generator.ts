import puppeteer from 'puppeteer';

export interface PuppeteerGenerationOptions {
  title?: string;
  content?: string;
  contractNumber?: string;
  counterparty?: string;
  value?: string;
  currency?: string;
  contractStatus?: string;
  startDate?: Date | string | null;
  expirationDate?: Date | string | null;
  approvedBy?: string[];
  approvedAt?: Date;
  approverNames?: string[];
  contractTitle?: string;
  version?: number;
  revisionNumber?: number;
  finalizationDate?: Date;
  checksum?: string;
}

export class PuppeteerGenerator {
  private browser: puppeteer.Browser | null = null;

  /**
   * Initialize browser instance
   */
  private async initializeBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  /**
   * Generate HTML content for the contract
   */
  private generateHTML(options: PuppeteerGenerationOptions): string {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.title || 'Contract Document'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Noto Sans', 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 40px;
            font-size: 12px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
            color: #1a1a1a;
          }
          
          .contract-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          
          .detail-section h2 {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 15px;
            color: #1a1a1a;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          
          .detail-item {
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
          }
          
          .detail-label {
            font-weight: 600;
            color: #555;
          }
          
          .detail-value {
            color: #333;
          }
          
          .content-separator {
            border-top: 1px solid #ddd;
            margin: 30px 0;
          }
          
          .content-section h2 {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 15px;
            color: #1a1a1a;
          }
          
          .contract-content {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
            border-left: 4px solid #007bff;
            margin-bottom: 30px;
          }
          
          .audit-section {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #333;
          }
          
          .audit-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
          }
          
          .approval-history h2 {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 15px;
            color: #1a1a1a;
          }
          
          .approver-item {
            background: #f0f8ff;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 3px;
            border-left: 3px solid #007bff;
          }
          
          .security-section h2 {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 15px;
            color: #1a1a1a;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 10px;
          }
          
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${options.title || 'CONTRACT DOCUMENT'}</h1>
        </div>
        
        <div class="contract-details">
          <div class="detail-section">
            <h2>Contract Details</h2>
            ${options.contractNumber ? `<div class="detail-item"><span class="detail-label">Contract Number:</span> <span class="detail-value">${options.contractNumber}</span></div>` : ''}
            ${options.counterparty ? `<div class="detail-item"><span class="detail-label">Counterparty:</span> <span class="detail-value">${options.counterparty}</span></div>` : ''}
            ${options.value && options.currency ? `<div class="detail-item"><span class="detail-label">Value:</span> <span class="detail-value">${options.value} ${options.currency}</span></div>` : ''}
          </div>
          
          <div class="detail-section">
            <h2>Dates & Status</h2>
                    ${options.startDate ? `<div class="detail-item"><span class="detail-label">Start Date:</span> <span class="detail-value">${typeof options.startDate === 'string' ? options.startDate : options.startDate.toLocaleDateString()}</span></div>` : ''}
        ${options.expirationDate ? `<div class="detail-item"><span class="detail-label">Expiration Date:</span> <span class="detail-value">${typeof options.expirationDate === 'string' ? options.expirationDate : options.expirationDate.toLocaleDateString()}</span></div>` : ''}
            ${options.contractStatus ? `<div class="detail-item"><span class="detail-label">Status:</span> <span class="detail-value">${options.contractStatus}</span></div>` : ''}
          </div>
        </div>
        
        <div class="content-separator"></div>
        
        <div class="content-section">
          <h2>Contract Content</h2>
          <div class="contract-content">
            ${options.content || 'No contract content available.'}
          </div>
        </div>
        
        <div class="audit-section">
          <div class="audit-grid">
            <div class="detail-section">
              <h2>Audit Information</h2>
              ${options.contractNumber ? `<div class="detail-item"><span class="detail-label">Contract Number:</span> <span class="detail-value">${options.contractNumber}</span></div>` : ''}
              ${options.contractTitle ? `<div class="detail-item"><span class="detail-label">Contract Title:</span> <span class="detail-value">${options.contractTitle}</span></div>` : ''}
              ${options.version ? `<div class="detail-item"><span class="detail-label">Version:</span> <span class="detail-value">${options.version}</span></div>` : ''}
            </div>
            
            <div class="detail-section">
              <h2>Timeline</h2>
              ${options.finalizationDate ? `<div class="detail-item"><span class="detail-label">Finalized:</span> <span class="detail-value">${options.finalizationDate.toLocaleDateString()}</span></div>` : ''}
              ${options.approvedAt ? `<div class="detail-item"><span class="detail-label">Approved:</span> <span class="detail-value">${options.approvedAt.toLocaleDateString()}</span></div>` : ''}
            </div>
          </div>
          
          <div class="approval-history">
            <h2>Approval History</h2>
            ${options.approverNames && options.approverNames.length > 0 
              ? options.approverNames.map((name, index) => 
                  `<div class="approver-item">Approver ${index + 1}: ${name}</div>`
                ).join('')
              : '<div class="approver-item">No approval history available</div>'
            }
          </div>
          
          <div class="security-section">
            <h2>Digital Signature & Security</h2>
            ${options.checksum ? `<div class="detail-item"><span class="detail-label">Document Checksum:</span> <span class="detail-value">${options.checksum}</span></div>` : ''}
            <div class="detail-item"><span class="detail-label">Generated At:</span> <span class="detail-value">${new Date().toLocaleString()}</span></div>
            <div class="detail-item"><span class="detail-label">PDF Version:</span> <span class="detail-value">3.0 (Puppeteer)</span></div>
          </div>
        </div>
        
        <div class="footer">
          <p>Generated by UXOne Contract Management System</p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  /**
   * Generate contract PDF with perfect Vietnamese text support
   */
  async generateContractPDF(options: PuppeteerGenerationOptions): Promise<Buffer> {
    try {
      console.log('🔍 Puppeteer PDF Generation Started');
      
      const browser = await this.initializeBrowser();
      const page = await browser.newPage();
      
      // Generate HTML content
      const htmlContent = this.generateHTML(options);
      
      // Set content and wait for fonts to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Wait for fonts to be ready
      await page.evaluateHandle('document.fonts.ready');
      
      console.log('🔍 HTML content loaded, generating PDF...');
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true,
        preferCSSPageSize: true
      });
      
      console.log('🔍 Puppeteer PDF Generation Complete');
      console.log('🔍 PDF Buffer Size:', pdfBuffer.length);
      
      // Close the page but keep browser for reuse
      await page.close();
      
      return pdfBuffer;
      
    } catch (error) {
      console.error('Error generating PDF with Puppeteer:', error);
      throw new Error('Failed to generate PDF with Puppeteer');
    }
  }

  /**
   * Generate simple PDF for testing
   */
  async generateSimplePDF(content: string, title: string = 'Document'): Promise<Buffer> {
    try {
      const browser = await this.initializeBrowser();
      const page = await browser.newPage();
      
      const simpleHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Noto Sans', Arial, sans-serif; padding: 40px; }
            h1 { color: #333; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="content">${content}</div>
        </body>
        </html>
      `;
      
      await page.setContent(simpleHTML, { waitUntil: 'networkidle0' });
      await page.evaluateHandle('document.fonts.ready');
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        printBackground: true
      });
      
      await page.close();
      return pdfBuffer;
      
    } catch (error) {
      console.error('Error generating simple PDF:', error);
      throw new Error('Failed to generate simple PDF');
    }
  }

  /**
   * Clean up browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default PuppeteerGenerator;
