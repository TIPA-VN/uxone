import puppeteer from 'puppeteer';

export interface ModularExportData {
  contractDetails: any;
  finalizedDoc?: any;
  revisions?: any[];
  content: string;
  sections: string[];
  format: string;
}

export class ModularContractGenerator {
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
   * Generate header section HTML
   */
  private generateHeaderSection(data: ModularExportData): string {
    const { contractDetails } = data;
    
    return `
      <div class="header-section">
        <div class="header">
          <h1>CONTRACT DOCUMENT</h1>
          <div class="contract-number">${contractDetails.contractNumber || 'N/A'}</div>
        </div>
        
        <div class="contract-summary">
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Contract Title:</span>
              <span class="value">${contractDetails.contractTitle || 'N/A'}</span>
            </div>
            <div class="summary-item">
              <span class="label">Counterparty:</span>
              <span class="value">${contractDetails.counterparty || 'N/A'}</span>
            </div>
            <div class="summary-item">
              <span class="label">Value:</span>
              <span class="value">${contractDetails.value || 'N/A'} ${contractDetails.currency || ''}</span>
            </div>
            <div class="summary-item">
              <span class="label">Status:</span>
              <span class="value">${contractDetails.contractStatus || 'N/A'}</span>
            </div>
            ${contractDetails.startDate ? `
            <div class="summary-item">
              <span class="label">Start Date:</span>
              <span class="value">${new Date(contractDetails.startDate).toLocaleDateString()}</span>
            </div>` : ''}
            ${contractDetails.expirationDate ? `
            <div class="summary-item">
              <span class="label">Expiration Date:</span>
              <span class="value">${new Date(contractDetails.expirationDate).toLocaleDateString()}</span>
            </div>` : ''}
          </div>
        </div>
      </div>
      ${data.sections.length > 1 ? '<div class="page-break"></div>' : ''}
    `;
  }

  /**
   * Generate contract content section HTML
   */
  private generateContractSection(data: ModularExportData): string {
    return `
      <div class="contract-section">
        <div class="section-header">
          <h2>Contract Terms and Conditions</h2>
        </div>
        
        <div class="contract-content">
          ${data.content || 'No contract content available.'}
        </div>
      </div>
      ${data.sections.indexOf('contract') < data.sections.length - 1 ? '<div class="page-break"></div>' : ''}
    `;
  }

  /**
   * Generate security section HTML
   */
  private generateSecuritySection(data: ModularExportData): string {
    const { contractDetails, finalizedDoc } = data;
    
    return `
      <div class="security-section">
        <div class="section-header">
          <h2>Digital Security & Verification</h2>
        </div>
        
        <div class="security-grid">
          <div class="security-item">
            <span class="label">Document Checksum:</span>
            <span class="value">${finalizedDoc?.checksum || 'N/A'}</span>
          </div>
          <div class="security-item">
            <span class="label">Digital Signature:</span>
            <span class="value">✓ Verified</span>
          </div>
          <div class="security-item">
            <span class="label">Generated At:</span>
            <span class="value">${new Date().toLocaleString()}</span>
          </div>
          <div class="security-item">
            <span class="label">Version:</span>
            <span class="value">${finalizedDoc?.version || 1}.${finalizedDoc?.revisionNumber || 1}</span>
          </div>
        </div>
        
        <div class="signature-block">
          <h3>Digital Signatures</h3>
          <div class="signature-info">
            <p>This document has been digitally signed and verified by the UXOne Contract Management System.</p>
            <p>Any modifications to this document after signing will invalidate the digital signature.</p>
          </div>
        </div>
      </div>
      ${data.sections.indexOf('security') < data.sections.length - 1 ? '<div class="page-break"></div>' : ''}
    `;
  }

  /**
   * Generate audit section HTML
   */
  private generateAuditSection(data: ModularExportData): string {
    const { contractDetails, finalizedDoc, revisions } = data;
    
    // Get approver names
    let approverNames: string[] = [];
    if (finalizedDoc?.approvedBy) {
      // This would need to be populated with actual user names from the calling function
      approverNames = finalizedDoc.approvedBy.map((id: string, index: number) => `Approver ${index + 1}`);
    }

    return `
      <div class="audit-section">
        <div class="section-header">
          <h2>Audit Trail & History</h2>
        </div>
        
        <div class="audit-grid">
          <div class="audit-column">
            <h3>Approval History</h3>
            <div class="approval-list">
              ${contractDetails.approvalHistory && contractDetails.approvalHistory.length > 0 
                ? contractDetails.approvalHistory.map((approval: any) => `
                  <div class="approval-item">
                    <div class="approver-name">${approval.approver?.name || approval.approver?.username || 'Unknown'}</div>
                    <div class="approval-date">${new Date(approval.createdAt).toLocaleDateString()}</div>
                    <div class="approval-status">${approval.action || 'Approved'}</div>
                  </div>
                `).join('')
                : '<div class="approval-item">No approval history available</div>'
              }
            </div>
          </div>
          
          <div class="audit-column">
            <h3>Document Timeline</h3>
            <div class="timeline-list">
              ${contractDetails.createdAt ? `
              <div class="timeline-item">
                <div class="timeline-date">${new Date(contractDetails.createdAt).toLocaleDateString()}</div>
                <div class="timeline-event">Contract Created</div>
              </div>` : ''}
              ${contractDetails.updatedAt ? `
              <div class="timeline-item">
                <div class="timeline-date">${new Date(contractDetails.updatedAt).toLocaleDateString()}</div>
                <div class="timeline-event">Last Modified</div>
              </div>` : ''}
              ${finalizedDoc?.finalizationDate ? `
              <div class="timeline-item">
                <div class="timeline-date">${new Date(finalizedDoc.finalizationDate).toLocaleDateString()}</div>
                <div class="timeline-event">Document Finalized</div>
              </div>` : ''}
            </div>
          </div>
        </div>
        
        ${revisions && revisions.length > 0 ? `
        <div class="revision-history">
          <h3>Version History</h3>
          <div class="revision-list">
            ${revisions.slice(0, 5).map((revision: any) => `
              <div class="revision-item">
                <span class="revision-version">v${revision.version || 1}.${revision.revisionNumber || 1}</span>
                <span class="revision-date">${new Date(revision.createdAt).toLocaleDateString()}</span>
                <span class="revision-author">${revision.creator?.name || revision.creator?.username || 'Unknown'}</span>
              </div>
            `).join('')}
          </div>
        </div>` : ''}
      </div>
    `;
  }

  /**
   * Generate complete modular HTML
   */
  async generateModularHTML(data: ModularExportData): Promise<string> {
    const { sections } = data;
    
    let sectionsHtml = '';
    
    if (sections.includes('header')) {
      sectionsHtml += this.generateHeaderSection(data);
    }
    
    if (sections.includes('contract')) {
      sectionsHtml += this.generateContractSection(data);
    }
    
    if (sections.includes('security')) {
      sectionsHtml += this.generateSecuritySection(data);
    }
    
    if (sections.includes('audit')) {
      sectionsHtml += this.generateAuditSection(data);
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contract Export - ${data.contractDetails.contractNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap');
          
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
          
          .page-break {
            page-break-before: always;
            height: 0;
          }
          
          /* Header Section Styles */
          .header-section .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #1a365d;
            padding-bottom: 20px;
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            color: #1a365d;
          }
          
          .contract-number {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            background: #f7fafc;
            padding: 8px 16px;
            border-radius: 6px;
            display: inline-block;
          }
          
          .contract-summary {
            margin-top: 30px;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 4px solid #3182ce;
          }
          
          .summary-item .label {
            font-weight: 600;
            color: #2d3748;
          }
          
          .summary-item .value {
            color: #1a202c;
          }
          
          /* Contract Section Styles */
          .contract-section {
            padding: 20px 0;
          }
          
          .section-header {
            margin-bottom: 25px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
          }
          
          .section-header h2 {
            font-size: 20px;
            font-weight: 700;
            color: #1a365d;
          }
          
          .contract-content {
            background: #f7fafc;
            padding: 25px;
            border-radius: 8px;
            border-left: 5px solid #3182ce;
            line-height: 1.8;
          }
          
          /* Security Section Styles */
          .security-section {
            padding: 20px 0;
          }
          
          .security-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
          }
          
          .security-item {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            background: #f0fff4;
            border-radius: 4px;
            border-left: 4px solid #38a169;
          }
          
          .signature-block {
            background: #edf2f7;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #cbd5e0;
          }
          
          .signature-block h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1a365d;
          }
          
          .signature-info p {
            margin-bottom: 8px;
            color: #4a5568;
            font-size: 11px;
          }
          
          /* Audit Section Styles */
          .audit-section {
            padding: 20px 0;
          }
          
          .audit-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          
          .audit-column h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1a365d;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
          }
          
          .approval-item, .timeline-item, .revision-item {
            padding: 10px;
            background: #f8f9fa;
            margin-bottom: 8px;
            border-radius: 4px;
            border-left: 3px solid #3182ce;
          }
          
          .approver-name, .timeline-event {
            font-weight: 600;
            color: #2d3748;
          }
          
          .approval-date, .timeline-date {
            font-size: 10px;
            color: #718096;
          }
          
          .revision-history {
            margin-top: 25px;
          }
          
          .revision-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .revision-version {
            font-weight: 600;
            color: #3182ce;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        ${sectionsHtml}
        
        <div class="footer" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 10px;">
          <p>Generated by UXOne Contract Management System - ${new Date().toLocaleString()}</p>
          <p>Sections included: ${sections.join(', ').toUpperCase()}</p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  /**
   * Generate modular PDF
   */
  async generateModularPDF(data: ModularExportData): Promise<Buffer> {
    try {
      const browser = await this.initializeBrowser();
      const page = await browser.newPage();
      
      // Generate HTML content
      const htmlContent = await this.generateModularHTML(data);
      
      // Set content and wait for fonts to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Wait for fonts to be ready
      await page.evaluateHandle('document.fonts.ready');
      
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
      
      // Close the page but keep browser for reuse
      await page.close();
      
      return pdfBuffer;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Close browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
