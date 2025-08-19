import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication back when auth is properly configured
    // For now, allow uploads without authentication to test functionality
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const documentType = formData.get('documentType') as string || 'contract'
    const status = formData.get('status') as string || 'draft'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('Processing upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      title,
      documentType,
      status
    })

    let parsedContent = ''
    const parsedTitle = title || file.name.replace(/\.[^/.]+$/, '')

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse different file types
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      // Parse Word documents using JSZip to extract XML content with formatting
      console.log('Parsing Word document with JSZip and preserving formatting...')
      try {
        // Load the DOCX file as a ZIP archive
        const zip = new JSZip()
        const zipContent = await zip.loadAsync(arrayBuffer)
        
        // Extract the main document XML file
        const documentXml = zipContent.file('word/document.xml')
        if (!documentXml) {
          throw new Error('Could not find document.xml in Word document')
        }
        
        // Read the XML content
        const xmlContent = await documentXml.async('string')
        console.log('Extracted XML content length:', xmlContent.length)
        
        // Convert Word XML to HTML with formatting preserved
        parsedContent = convertDocxToHtml(xmlContent)
        
        if (!parsedContent || parsedContent.length < 20) {
          throw new Error('Could not extract meaningful content from Word document')
        }
        
        console.log('Word document parsed successfully with formatting, content length:', parsedContent.length)
        console.log('Content preview:', parsedContent.substring(0, 300) + '...')
        
      } catch (error) {
        console.error('Error parsing Word document:', error)
        return NextResponse.json({ 
          error: 'Failed to parse Word document. This file may be corrupted, use advanced formatting, or be in an older .doc format. Please try copying and pasting the content directly into the editor.',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 })
      }
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      // Parse plain text file
      console.log('Parsing plain text file...')
      try {
        parsedContent = buffer.toString('utf-8')
        console.log('Text file parsed successfully, content length:', parsedContent.length)
      } catch (error) {
        console.error('Error parsing text file:', error)
        return NextResponse.json({ error: 'Failed to parse text file' }, { status: 400 })
      }
    } else if (file.type === 'text/rtf' || file.name.endsWith('.rtf')) {
      // Parse RTF file (basic text extraction)
      console.log('Parsing RTF file...')
      try {
        // Simple RTF to text conversion (removes RTF markup)
        const rtfText = buffer.toString('utf-8')
        parsedContent = rtfText
          .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF commands
          .replace(/\{|\}/g, '') // Remove braces
          .replace(/\\'/g, "'") // Convert escaped quotes
          .replace(/\\"/g, '"')
          .replace(/\\\n/g, '\n') // Convert escaped newlines
          .replace(/\\\r/g, '\r')
          .replace(/\\\t/g, '\t')
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
        
        console.log('RTF file parsed successfully, content length:', parsedContent.length)
      } catch (error) {
        console.error('Error parsing RTF file:', error)
        return NextResponse.json({ error: 'Failed to parse RTF file' }, { status: 400 })
      }
    } else if (file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm')) {
      // Parse HTML file
      console.log('Parsing HTML file...')
      try {
        const htmlText = buffer.toString('utf-8')
        // Extract text content from HTML (basic approach)
        parsedContent = htmlText
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace HTML entities
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
        
        console.log('HTML file parsed successfully, content length:', parsedContent.length)
      } catch (error) {
        console.error('Error parsing HTML file:', error)
        return NextResponse.json({ error: 'Failed to parse HTML file' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ 
        error: 'Unsupported file type. Please upload DOC, DOCX, TXT, RTF, or HTML files. For PDFs, please copy and paste the content directly into the editor.' 
      }, { status: 400 })
    }

    // For Word documents, content is already HTML. For others, convert to HTML
    let htmlContent = parsedContent
    if (!file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
      htmlContent = convertTextToHTML(parsedContent)
    }

    console.log('Upload processing completed successfully')
    console.log('Final content length:', htmlContent.length)

    return NextResponse.json({
      success: true,
      title: parsedTitle,
      content: htmlContent,
      originalFileName: file.name,
      fileSize: file.size,
      message: 'Document uploaded and parsed successfully'
    })

  } catch (error) {
    console.error('Upload processing error:', error)
    return NextResponse.json({ 
      error: 'Failed to process uploaded file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Enhanced function to convert Word XML to HTML with formatting preserved
function convertDocxToHtml(xmlContent: string): string {
  if (!xmlContent) return ''

  let html = ''
  
  // Split XML into paragraphs
  const paragraphs = xmlContent.split(/<\/?w:p[^>]*>/)
  
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue
    
    // Check if this paragraph is a heading
    const headingMatch = paragraph.match(/<w:pStyle[^>]*w:val="([^"]*)"[^>]*>/)
    const isHeading = headingMatch && headingMatch[1].includes('Heading')
    
    // Check if this paragraph is a list item
    const isListItem = paragraph.includes('<w:numPr>') || paragraph.includes('<w:ilvl')
    
    // Check if this paragraph is a table
    const isTable = paragraph.includes('<w:tbl>')
    
    if (isHeading) {
      // Extract heading level and text
      const headingLevel = headingMatch[1].match(/Heading(\d+)/)
      const level = headingLevel ? Math.min(parseInt(headingLevel[1]), 6) : 2
      const headingText = extractTextFromParagraph(paragraph)
      if (headingText.trim()) {
        html += `<h${level}>${headingText}</h${level}>`
      }
    } else if (isListItem) {
      // Extract list item text
      const listText = extractTextFromParagraph(paragraph)
      if (listText.trim()) {
        html += `<li>${listText}</li>`
      }
    } else if (isTable) {
      // Handle table content (simplified - extract as text for now)
      const tableText = extractTextFromParagraph(paragraph)
      if (tableText.trim()) {
        html += `<p><strong>[Table Content]:</strong> ${tableText}</p>`
      }
    } else {
      // Regular paragraph
      const paragraphText = extractTextFromParagraph(paragraph)
      if (paragraphText.trim()) {
        html += `<p>${paragraphText}</p>`
      }
    }
  }
  
  // Clean up the HTML and wrap list items properly
  html = html
    .replace(/<p><\/p>/g, '') // Remove empty paragraphs
    .replace(/\n\s*\n/g, '\n') // Remove excessive newlines
    .trim()
  
  // Wrap consecutive list items in ul tags
  html = html.replace(/(<li>.*?<\/li>)+/g, (match) => {
    return `<ul>${match}</ul>`
  })
  
  return html
}

// Extract formatted text from a paragraph XML
function extractTextFromParagraph(paragraphXml: string): string {
  if (!paragraphXml) return ''
  
  let result = ''
  
  // Split into runs (text with consistent formatting)
  const runs = paragraphXml.split(/<\/?w:r[^>]*>/)
  
  for (const run of runs) {
    if (!run.trim()) continue
    
    // Extract text content
    const textMatch = run.match(/<w:t[^>]*>([^<]*)<\/w:t>/)
    if (!textMatch) continue
    
    let text = textMatch[1]
    if (!text.trim()) continue
    
    // Check for bold formatting
    const isBold = run.includes('<w:b/>') || run.includes('<w:b ')
    
    // Check for italic formatting
    const isItalic = run.includes('<w:i/>') || run.includes('<w:i ')
    
    // Check for underline formatting
    const isUnderline = run.includes('<w:u/>') || run.includes('<w:u ')
    
    // Apply formatting
    if (isBold && isItalic) {
      text = `<strong><em>${text}</em></strong>`
    } else if (isBold) {
      text = `<strong>${text}</strong>`
    } else if (isItalic) {
      text = `<em>${text}</em>`
    }
    
    if (isUnderline) {
      text = `<u>${text}</u>`
    }
    
    result += text
  }
  
  return result
}

// Helper function to convert plain text to basic HTML
function convertTextToHTML(text: string): string {
  if (!text) return ''

  return text
    .split('\n')
    .map(line => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return '<br>'
      
      // Detect headings (short lines ending with common punctuation)
      if (trimmedLine.length < 100 && /^[A-Z][^.!?]*[.!?]?$/.test(trimmedLine)) {
        return `<h2>${trimmedLine}</h2>`
      }
      
      // Detect lists (lines starting with numbers, bullets, or dashes)
      if (/^[\d\-•*]\s/.test(trimmedLine)) {
        return `<li>${trimmedLine.replace(/^[\d\-•*]\s/, '')}</li>`
      }
      
      // Regular paragraphs
      return `<p>${trimmedLine}</p>`
    })
    .join('')
    .replace(/<li>.*?<\/li>/g, (match) => {
      // Wrap consecutive list items in ul tags
      return `<ul>${match}</ul>`
    })
    .replace(/<\/ul><ul>/g, '') // Remove duplicate ul tags
}
