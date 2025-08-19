import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

export interface ExportOptions {
  title: string
  content: string
  author?: string
  company?: string
}

export async function exportToWord(options: ExportOptions): Promise<Buffer> {
  const { title, content, author = 'Document Author' } = options

  // Parse HTML content and preserve formatting using regex (server-side compatible)
  const paragraphs = []
  
  // Split content into lines and process each line
  const lines = content.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    // Check for different HTML elements
    if (trimmedLine.match(/^<h1[^>]*>(.*?)<\/h1>$/i)) {
      // H1 heading
      const text = trimmedLine.replace(/<h1[^>]*>(.*?)<\/h1>/i, '$1')
      paragraphs.push(new Paragraph({
        text: text,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400, before: 400 }
      }))
    } else if (trimmedLine.match(/^<h2[^>]*>(.*?)<\/h2>$/i)) {
      // H2 heading
      const text = trimmedLine.replace(/<h2[^>]*>(.*?)<\/h2>/i, '$1')
      paragraphs.push(new Paragraph({
        text: text,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 300, before: 300 }
      }))
    } else if (trimmedLine.match(/^<h3[^>]*>(.*?)<\/h3>$/i)) {
      // H3 heading
      const text = trimmedLine.replace(/<h3[^>]*>(.*?)<\/h3>/i, '$1')
      paragraphs.push(new Paragraph({
        text: text,
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 250, before: 250 }
      }))
    } else if (trimmedLine.match(/^<li[^>]*>(.*?)<\/li>$/i)) {
      // List item
      const text = trimmedLine.replace(/<li[^>]*>(.*?)<\/li>/i, '$1')
      paragraphs.push(new Paragraph({
        text: `• ${text}`,
        spacing: { after: 100, before: 100 },
        indent: { left: 720 } // 0.5 inch indent
      }))
    } else if (trimmedLine.match(/^<blockquote[^>]*>(.*?)<\/blockquote>$/i)) {
      // Blockquote
      const text = trimmedLine.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/i, '$1')
      paragraphs.push(new Paragraph({
        text: text,
        spacing: { after: 200, before: 200 },
        indent: { left: 720, right: 720 }, // 0.5 inch indent on both sides
        border: { left: { size: 4, color: 'CCCCCC', style: 'single' } }
      }))
    } else if (trimmedLine.match(/^<pre[^>]*>(.*?)<\/pre>$/i)) {
      // Code block
      const text = trimmedLine.replace(/<pre[^>]*>(.*?)<\/pre>/i, '$1')
      paragraphs.push(new Paragraph({
        text: text,
        spacing: { after: 200, before: 200 },
        indent: { left: 720, right: 720 },
        border: { top: { size: 1, color: 'CCCCCC', style: 'single' }, bottom: { size: 1, color: 'CCCCCC', style: 'single' }, left: { size: 1, color: 'CCCCCC', style: 'single' }, right: { size: 1, color: 'CCCCCC', style: 'single' } },
        shading: { fill: 'F5F5F5' }
      }))
    } else if (trimmedLine.match(/^<p[^>]*>(.*?)<\/p>$/i)) {
      // Paragraph
      const text = trimmedLine.replace(/<p[^>]*>(.*?)<\/p>/i, '$1')
      if (text.trim()) {
        paragraphs.push(new Paragraph({
          text: text,
          spacing: { after: 200, before: 200 }
        }))
      }
    } else if (trimmedLine.match(/^<br\s*\/?>$/i)) {
      // Line break
      paragraphs.push(new Paragraph({
        text: '',
        spacing: { after: 100 }
      }))
    } else if (trimmedLine.match(/^<ul[^>]*>$/i) || trimmedLine.match(/^<\/ul>$/i) || 
               trimmedLine.match(/^<ol[^>]*>$/i) || trimmedLine.match(/^<\/ol>$/i)) {
      // List container tags - skip these
      continue
    } else {
      // Regular text or mixed HTML - process inline formatting
      const processedText = trimmedLine
      
      // Process inline formatting
      const textRuns = []
      let currentText = processedText
      
      // Handle bold text
      currentText = currentText.replace(/<strong[^>]*>(.*?)<\/strong>/gi, (match, text) => {
        textRuns.push(new TextRun({ text: text, size: 24, bold: true }))
        return ''
      })
      
      // Handle italic text
      currentText = currentText.replace(/<em[^>]*>(.*?)<\/em>/gi, (match, text) => {
        textRuns.push(new TextRun({ text: text, size: 24, italics: true }))
        return ''
      })
      
      // Handle inline code
      currentText = currentText.replace(/<code[^>]*>(.*?)<\/code>/gi, (match, text) => {
        textRuns.push(new TextRun({ text: text, size: 24, font: 'Courier New' }))
        return ''
      })
      
      // Add remaining text as regular text
      if (currentText.trim()) {
        textRuns.push(new TextRun({ text: currentText, size: 24 }))
      }
      
      // Create paragraph with mixed formatting
      if (textRuns.length > 0) {
        paragraphs.push(new Paragraph({
          children: textRuns,
          spacing: { after: 200, before: 200 }
        }))
      }
    }
  }
  
  // If no paragraphs were created, create a simple text paragraph
  if (paragraphs.length === 0) {
    const cleanText = content.replace(/<[^>]*>/g, '').trim()
    if (cleanText) {
      paragraphs.push(new Paragraph({
        text: cleanText,
        spacing: { after: 200, before: 200 }
      }))
    }
  }

  // Create document structure
  const doc = new Document({
    creator: author,
    title: title,
    description: `Exported from Toshiba Industrial Products Asia Document Editor`,
    sections: [
      {
        properties: {},
        children: paragraphs
      }
    ]
  })

  // Generate the document
  const buffer = await Packer.toBuffer(doc)
  return buffer
}

export async function exportToPDF(options: ExportOptions): Promise<Buffer> {
  const { title, content, author = 'Document Author' } = options

  // Create HTML content with proper styling for PDF conversion
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 1in;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            font-size: 12pt;
          }
          h1 {
            font-size: 24pt;
            font-weight: 700;
            text-align: center;
            margin-bottom: 1em;
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.25em;
          }
          h2 {
            font-size: 18pt;
            font-weight: 600;
            margin: 1em 0 0.5em 0;
            color: #374151;
          }
          h3 {
            font-size: 14pt;
            font-weight: 600;
            margin: 1em 0 0.5em 0;
            color: #4b5563;
          }
          p {
            margin: 0.75em 0;
            text-align: justify;
          }
          blockquote {
            border-left: 4px solid #3b82f6;
            margin: 1em 0;
            padding: 0.5em 1em;
            background-color: #f8fafc;
            color: #475569;
            font-style: italic;
          }
          code {
            background-color: #f1f5f9;
            padding: 0.125em 0.25em;
            border-radius: 0.25em;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.875em;
            color: #dc2626;
          }
          pre {
            background-color: #1e293b;
            color: #e2e8f0;
            padding: 1em;
            border-radius: 0.5em;
            overflow-x: auto;
            margin: 1em 0;
            white-space: pre-wrap;
          }
          pre code {
            background-color: transparent;
            color: inherit;
            padding: 0;
          }
          ul, ol {
            margin: 0.75em 0;
            padding-left: 1.5em;
          }
          li {
            margin: 0.25em 0;
          }
          .header {
            text-align: center;
            margin-bottom: 2em;
            padding-bottom: 1em;
            border-bottom: 2px solid #e5e7eb;
          }
          .footer {
            text-align: center;
            margin-top: 2em;
            padding-top: 1em;
            border-top: 1px solid #e5e7eb;
            font-size: 0.875em;
            color: #6b7280;
          }
          .content {
            margin: 2em 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p><strong>Author:</strong> ${author}</p>
          <p><strong>Exported:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="content">
          ${content}
        </div>
        
        <div class="footer">
          <p>Generated by UXOne Document Editor</p>
        </div>
      </body>
    </html>
  `

  // For now, return the HTML content as a buffer
  // This can be converted to PDF using a browser print-to-PDF or external service
  return Buffer.from(htmlContent, 'utf-8')
}

export function getExportFilename(title: string, format: 'docx' | 'pdf'): string {
  const cleanTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
  const timestamp = new Date().toISOString().split('T')[0]
  return `${cleanTitle}_${timestamp}.${format}`
}
