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
  
  // First, handle tables separately
  const tableMatches = xmlContent.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g)
  if (tableMatches) {
    for (const tableMatch of tableMatches) {
      html += convertTableToHtml(tableMatch)
      // Remove the table from xmlContent to avoid double processing
      xmlContent = xmlContent.replace(tableMatch, '')
    }
  }
  
  // Split XML into paragraphs
  const paragraphs = xmlContent.split(/<\/?w:p[^>]*>/)
  
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue
    
    // Check if this paragraph is a heading
    const headingMatch = paragraph.match(/<w:pStyle[^>]*w:val="([^"]*)"[^>]*>/)
    const isHeading = headingMatch && headingMatch[1].includes('Heading')
    
    // Check if this paragraph is a list item
    const isListItem = paragraph.includes('<w:numPr>') || paragraph.includes('<w:ilvl')
    
    if (isHeading) {
      // Extract heading level and text
      const headingLevel = headingMatch[1].match(/Heading(\d+)/)
      const level = headingLevel ? Math.min(parseInt(headingLevel[1]), 6) : 2
      const headingText = extractTextFromParagraph(paragraph)
      if (headingText.trim()) {
        html += `<h${level}>${headingText}</h${level}>`
      }
    } else if (isListItem) {
      // Extract list item text with indentation level
      const levelMatch = paragraph.match(/<w:ilvl[^>]*w:val="([^"]*)"/)
      const level = levelMatch ? parseInt(levelMatch[1]) : 0
      const listText = extractTextFromParagraph(paragraph)
      if (listText.trim()) {
        // Add data attribute to track nesting level
        html += `<li data-level="${level}">${listText}</li>`
      }
    } else {
      // Regular paragraph
      const paragraphText = extractTextFromParagraph(paragraph)
      if (paragraphText.trim()) {
        // Check if the paragraph already has styling (from extractTextFromParagraph)
        if (paragraphText.startsWith('<div style=')) {
          html += paragraphText
        } else {
          html += `<p>${paragraphText}</p>`
        }
      }
    }
  }
  
  // Clean up the HTML and wrap list items properly
  html = html
    .replace(/<p><\/p>/g, '') // Remove empty paragraphs
    .replace(/\n\s*\n/g, '\n') // Remove excessive newlines
    .trim()
  
  // Wrap consecutive list items in nested ul/ol tags based on levels
  html = wrapListItems(html)
  
  return html
}

// Convert Word table XML to HTML table
function convertTableToHtml(tableXml: string): string {
  let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">'
  
  // Extract table rows
  const rowMatches = tableXml.match(/<w:tr>[\s\S]*?<\/w:tr>/g)
  if (!rowMatches) return ''
  
  for (const rowMatch of rowMatches) {
    tableHtml += '<tr>'
    
    // Extract table cells
    const cellMatches = rowMatch.match(/<w:tc>[\s\S]*?<\/w:tc>/g)
    if (cellMatches) {
      for (const cellMatch of cellMatches) {
        // Extract cell content (paragraphs within the cell)
        const cellParagraphs = cellMatch.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g)
        let cellContent = ''
        
        if (cellParagraphs) {
          for (const cellParagraph of cellParagraphs) {
            const paragraphContent = extractTextFromParagraph(cellParagraph)
            if (paragraphContent.trim()) {
              cellContent += paragraphContent
            }
          }
        }
        
        tableHtml += `<td style="border: 1px solid #ccc; padding: 8px; vertical-align: top;">${cellContent || '&nbsp;'}</td>`
      }
    }
    
    tableHtml += '</tr>'
  }
  
  tableHtml += '</table>'
  return tableHtml
}

// Wrap list items in proper nested ul/ol structure
function wrapListItems(html: string): string {
  const listItems = html.match(/<li[^>]*>.*?<\/li>/g)
  if (!listItems) return html
  
  let result = html
  const listStack: Array<{level: number, type: 'ul' | 'ol'}> = []
  const currentHtml = ''
  
  // Simple approach: wrap consecutive list items in ul tags
  result = result.replace(/(<li[^>]*data-level="[^"]*">.*?<\/li>)+/g, (match) => {
    const items = match.match(/<li[^>]*data-level="([^"]*)">(.*?)<\/li>/g)
    if (!items) return match
    
    let nestedHtml = ''
    let currentLevel = -1
    
    for (const item of items) {
      const levelMatch = item.match(/data-level="([^"]*)"/)
      const contentMatch = item.match(/<li[^>]*>(.*?)<\/li>/)
      
      const level = levelMatch ? parseInt(levelMatch[1]) : 0
      const content = contentMatch ? contentMatch[1] : ''
      
      if (level > currentLevel) {
        // Start new list
        nestedHtml += '<ul>'
        currentLevel = level
      } else if (level < currentLevel) {
        // Close previous list
        nestedHtml += '</ul>'
        currentLevel = level
      }
      
      nestedHtml += `<li>${content}</li>`
    }
    
    // Close any remaining open lists
    while (currentLevel >= 0) {
      nestedHtml += '</ul>'
      currentLevel--
    }
    
    return nestedHtml
  })
  
  // Fallback: simple ul wrapping for any remaining consecutive li elements
  result = result.replace(/(<li>.*?<\/li>)+/g, (match) => {
    return `<ul>${match}</ul>`
  })
  
  return result
}

// Extract formatted text from a paragraph XML with enhanced formatting preservation
function extractTextFromParagraph(paragraphXml: string): string {
  if (!paragraphXml) return ''
  
  let result = ''
  
  // Check for paragraph-level indentation and alignment
  const indentMatch = paragraphXml.match(/<w:ind[^>]*w:left="([^"]*)"/)
  const rightIndentMatch = paragraphXml.match(/<w:ind[^>]*w:right="([^"]*)"/)
  const firstLineMatch = paragraphXml.match(/<w:ind[^>]*w:firstLine="([^"]*)"/)
  const hangingMatch = paragraphXml.match(/<w:ind[^>]*w:hanging="([^"]*)"/)
  
  // Check for paragraph alignment
  const alignmentMatch = paragraphXml.match(/<w:jc[^>]*w:val="([^"]*)"/)
  
  // Convert Word units (twips) to CSS units (approximate)
  const leftIndent = indentMatch ? Math.round(parseInt(indentMatch[1]) / 20) : 0 // Convert twips to pixels
  const rightIndent = rightIndentMatch ? Math.round(parseInt(rightIndentMatch[1]) / 20) : 0
  const firstLineIndent = firstLineMatch ? Math.round(parseInt(firstLineMatch[1]) / 20) : 0
  const hangingIndent = hangingMatch ? Math.round(parseInt(hangingMatch[1]) / 20) : 0
  
  // Split into runs (text with consistent formatting)
  const runs = paragraphXml.split(/<\/?w:r[^>]*>/)
  
  for (const run of runs) {
    if (!run.trim()) continue
    
    // Extract text content (including tabs and spaces)
    const textMatches = run.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
    const tabMatches = run.match(/<w:tab\/>/g)
    const spaceMatches = run.match(/<w:space[^>]*\/>/g)
    const breakMatches = run.match(/<w:br[^>]*\/>/g)
    
    if (!textMatches && !tabMatches && !spaceMatches && !breakMatches) continue
    
    let text = ''
    
    // Process text content
    if (textMatches) {
      for (const textMatch of textMatches) {
        const content = textMatch.match(/<w:t[^>]*>([^<]*)<\/w:t>/)
        if (content) {
          text += content[1]
        }
      }
    }
    
    // Process tabs - convert to HTML entities or CSS
    if (tabMatches) {
      text += '&emsp;'.repeat(tabMatches.length) // Em space for tabs
    }
    
    // Process line breaks
    if (breakMatches) {
      text += '<br>'.repeat(breakMatches.length)
    }
    
    // Process spaces (preserve multiple spaces)
    if (spaceMatches) {
      text += '&nbsp;'.repeat(spaceMatches.length)
    }
    
    if (!text.trim() && !text.includes('&emsp;') && !text.includes('&nbsp;') && !text.includes('<br>')) continue
    
    // Check for character-level formatting
    const isBold = run.includes('<w:b/>') || run.includes('<w:b ')
    const isItalic = run.includes('<w:i/>') || run.includes('<w:i ')
    const isUnderline = run.includes('<w:u/>') || run.includes('<w:u ')
    const isStrike = run.includes('<w:strike/>') || run.includes('<w:strike ')
    const isSubscript = run.includes('<w:vertAlign w:val="subscript"')
    const isSuperscript = run.includes('<w:vertAlign w:val="superscript"')
    
    // Check for font size
    const fontSizeMatch = run.match(/<w:sz[^>]*w:val="([^"]*)"/)
    const fontSize = fontSizeMatch ? `${Math.round(parseInt(fontSizeMatch[1]) / 2)}px` : null
    
    // Check for font color
    const colorMatch = run.match(/<w:color[^>]*w:val="([^"]*)"/)
    const color = colorMatch ? `#${colorMatch[1]}` : null
    
    // Check for highlighting
    const highlightMatch = run.match(/<w:highlight[^>]*w:val="([^"]*)"/)
    const highlight = highlightMatch ? highlightMatch[1] : null
    
    // Apply formatting with CSS for complex styles
    let formattedText = text
    
    // Apply basic HTML formatting
    if (isBold && isItalic) {
      formattedText = `<strong><em>${formattedText}</em></strong>`
    } else if (isBold) {
      formattedText = `<strong>${formattedText}</strong>`
    } else if (isItalic) {
      formattedText = `<em>${formattedText}</em>`
    }
    
    if (isUnderline) {
      formattedText = `<u>${formattedText}</u>`
    }
    
    if (isStrike) {
      formattedText = `<del>${formattedText}</del>`
    }
    
    if (isSubscript) {
      formattedText = `<sub>${formattedText}</sub>`
    }
    
    if (isSuperscript) {
      formattedText = `<sup>${formattedText}</sup>`
    }
    
    // Apply CSS styles for complex formatting
    const styles = []
    if (fontSize) styles.push(`font-size: ${fontSize}`)
    if (color && color !== '#000000') styles.push(`color: ${color}`)
    if (highlight) styles.push(`background-color: ${highlight}`)
    
    if (styles.length > 0) {
      formattedText = `<span style="${styles.join('; ')}">${formattedText}</span>`
    }
    
    result += formattedText
  }
  
  // Apply paragraph-level styling
  const paragraphStyles = []
  if (leftIndent > 0) paragraphStyles.push(`margin-left: ${leftIndent}px`)
  if (rightIndent > 0) paragraphStyles.push(`margin-right: ${rightIndent}px`)
  if (firstLineIndent > 0) paragraphStyles.push(`text-indent: ${firstLineIndent}px`)
  if (hangingIndent > 0) paragraphStyles.push(`text-indent: -${hangingIndent}px; padding-left: ${hangingIndent}px`)
  
  // Apply alignment
  if (alignmentMatch) {
    const alignment = alignmentMatch[1]
    if (alignment === 'center') paragraphStyles.push('text-align: center')
    else if (alignment === 'right') paragraphStyles.push('text-align: right')
    else if (alignment === 'justify') paragraphStyles.push('text-align: justify')
  }
  
  // Wrap result with styling if needed
  if (paragraphStyles.length > 0) {
    result = `<div style="${paragraphStyles.join('; ')}">${result}</div>`
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
