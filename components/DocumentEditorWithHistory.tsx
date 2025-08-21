'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Upload,
  FileText
} from 'lucide-react'
import HistoryPanel from './HistoryPanel'

interface DocumentEditorWithHistoryProps {
  documentId: string
  initialContent?: string
  initialTitle?: string
  onSave?: (content: string, title: string) => void
}

const DocumentEditorWithHistory: React.FC<DocumentEditorWithHistoryProps> = ({
  documentId,
  initialContent = '',
  initialTitle = '',
  onSave
}) => {
  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState(initialTitle)
  const [isSaving, setIsSaving] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [lastSaveMessage, setLastSaveMessage] = useState<string | null>(null)
  const [lastKnownVersion, setLastKnownVersion] = useState<number | null>(null)
  const [showOutdatedWarning, setShowOutdatedWarning] = useState(false)
  const [exportingWord, setExportingWord] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
        codeBlock: false
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document...'
      })
    ],
    content: initialContent,
    immediatelyRender: false,
    onCreate: () => {
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    }
  })

  // Polling for concurrent edits
  useEffect(() => {
    if (!documentId || documentId.startsWith('new-')) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.version && lastKnownVersion && data.version > lastKnownVersion) {
            setShowOutdatedWarning(true)
          }
          setLastKnownVersion(data.version)
        }
      } catch (error) {
      }
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(pollInterval)
  }, [documentId, lastKnownVersion])

  // Set initial content when editor is ready
  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])

  // Set initial title
  useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle)
    }
  }, [initialTitle])

  const handleSave = async () => {
    if (!content.trim() || !title.trim()) {
      setLastSaveMessage('❌ Please enter both title and content')
      return
    }

    setIsSaving(true)
    setLastSaveMessage(null)

    try {
      let actualDocumentId = documentId

      // If this is a new document, create it first
      if (documentId.startsWith('new-')) {
        const createResponse = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            content,
            documentType: 'contract',
            status: 'draft'
          })
        })

        if (!createResponse.ok) {
          throw new Error(`Failed to create document: ${createResponse.statusText}`)
        }

        const createdDoc = await createResponse.json()
        actualDocumentId = createdDoc.id
      }

      // Now save the document
      const saveResponse = await fetch(`/api/documents/${actualDocumentId}/save`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          version: lastKnownVersion || 1
        })
      })

      if (!saveResponse.ok) {
        throw new Error(`Failed to save document: ${saveResponse.statusText}`)
      }

      const savedDoc = await saveResponse.json()
      setLastKnownVersion(savedDoc.version)
      setShowOutdatedWarning(false)
      setLastSaveMessage(`✅ Document saved successfully! (Version ${savedDoc.version})`)
      
      if (onSave) {
        onSave(content, title)
      }

    } catch (error) {
      setLastSaveMessage(`❌ Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Fallback PDF export method that doesn't use html2canvas
  const handleExportPDFFallback = async () => {
    try {
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF
      
      // Create PDF with plain text content (no formatting)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const textWidth = pageWidth - (2 * margin)
      
      // Convert HTML content to plain text more safely
      let plainText = ''
      try {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = content
        plainText = tempDiv.textContent || tempDiv.innerText || ''
        
        // Clean up the temporary div
        tempDiv.remove()
      } catch (textError) {
        // Handle text extraction error silently
        return content;
      }
      
      if (!plainText.trim()) {
        plainText = 'Document content could not be extracted.'
      }
      
      // Split text into lines that fit the page
      const lines = pdf.splitTextToSize(plainText, textWidth)
      
      let currentY = margin
      let currentPage = 1
      const maxPages = 100 // Safety limit
      
      for (let i = 0; i < lines.length && currentPage <= maxPages; i++) {
        const line = lines[i]
        
        // Check if we need a new page
        if (currentY + 10 > pageHeight - margin) {
          if (currentPage >= maxPages) {
            // Reached maximum page limit, stopping PDF generation
            break;
          }
          pdf.addPage()
          currentPage++
          currentY = margin
        }
        
        // Add the line
        pdf.text(line, margin, currentY)
        currentY += 7 // Line height
      }
      
      // Add footer to all pages
      for (let page = 1; page <= currentPage; page++) {
        pdf.setPage(page)
        pdf.setFontSize(8)
        pdf.text('Generated by Toshiba Industrial Products Asia', pageWidth / 2, pageHeight - 10, { align: 'center' })
        pdf.text(new Date().toLocaleDateString(), pageWidth / 2, pageHeight - 5, { align: 'center' })
        pdf.text(`Page ${page} of ${currentPage}`, pageWidth / 2, pageHeight - 2, { align: 'center' })
      }
      
      // Save the PDF
      const filename = `${title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(filename)
      
    } catch (error) {
      throw error
    }
  }

  const handleExportWord = async () => {
    try {
      setExportingWord(true)
      setLastSaveMessage(null)
      
      const response = await fetch(`/api/documents/${documentId}/export/word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          author: 'Document Author'
        })
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setLastSaveMessage('✅ Word document exported successfully!')
    } catch (error) {
      setLastSaveMessage(`❌ Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExportingWord(false)
    }
  }

  /*
  const handleExportHTML = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
            h1, h2, h3 { color: #2c3e50; }
            h1 { font-size: 2em; margin-bottom: 0.5em; }
            h2 { font-size: 1.5em; margin-bottom: 0.5em; }
            h3 { font-size: 1.2em; margin-bottom: 0.5em; }
            p { margin-bottom: 1em; }
            ul, ol { margin-bottom: 1em; padding-left: 2em; }
            blockquote { border-left: 4px solid #3498db; padding-left: 1em; margin: 1em 0; font-style: italic; }
            code { background: #f8f9fa; padding: 0.2em 0.4em; border-radius: 3px; font-family: 'Courier New', monospace; }
            pre { background: #f8f9fa; padding: 1em; border-radius: 5px; overflow-x: auto; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            Generated by Toshiba Industrial Products Asia on ${new Date().toLocaleDateString()}
          </div>
        </body>
        </html>
      `
      
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setLastSaveMessage('✅ HTML document exported successfully!')
    } catch (error) {
      setLastSaveMessage(`❌ Failed to export HTML: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  */

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true)
      setLastSaveMessage(null)
      
      // For now, use the fallback method directly for better reliability
      // This avoids html2canvas issues while still providing good PDF output
      await handleExportPDFFallback()
      return
      
      // TODO: Re-enable html2canvas method once DOM issues are resolved
      /*
      // Use html2canvas for better formatting preservation
      let jsPDF, html2canvas
      
      try {
        // Import PDF libraries
        const jsPDFModule = await import('jspdf')
        jsPDF = jsPDFModule.jsPDF
        const html2canvasModule = await import('html2canvas')
        html2canvas = html2canvasModule.default
      } catch (importError) {
        // Handle import error silently
        // Fallback to HTML export
        exportToHTML();
      }
      
      // Create PDF with formatted HTML content
      const canvas = await html2canvas(editorRef.current!);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${documentTitle || 'document'}.pdf`);
      */
      
    } catch (error) {
      setLastSaveMessage('❌ PDF export failed. Please try HTML export instead.')
    } finally {
      setExportingPDF(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setIsUploading(true)
    setLastSaveMessage(null)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name.replace(/\.[^/.]+$/, '')) // Remove file extension for title
      formData.append('documentType', 'contract')
      formData.append('status', 'draft')

      // Upload file to parse and convert
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      // Update editor with parsed content
      if (result.content && editor) {
        editor.commands.setContent(result.content)
        setContent(result.content)
      }

      // Update title if provided
      if (result.title) {
        setTitle(result.title)
      }

      setLastSaveMessage(`✅ Document uploaded and parsed successfully!`)
      
      // If this was a new document, we now have content to save
      if (documentId.startsWith('new-')) {
        setLastSaveMessage(`✅ Document uploaded! Click Save to store it.`)
      }

    } catch (error) {
      setLastSaveMessage(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
      // Reset input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault()
            handleSave()
            break
          case 'b':
            e.preventDefault()
            editor?.chain().focus().toggleBold().run()
            break
          case 'i':
            e.preventDefault()
            editor?.chain().focus().toggleItalic().run()
            break
          case 'u':
            e.preventDefault()
            editor?.chain().focus().toggleUnderline().run()
            break
          case 'o':
            e.preventDefault()
            triggerFileUpload()
            break
        }
      }
      
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'w':
            e.preventDefault()
            handleExportWord()
            break
          case 'p':
            e.preventDefault()
            handleExportPDF()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editor, handleSave, handleExportWord, handleExportPDF, handleExportPDFFallback, triggerFileUpload])

  if (!editor) {
    return <div className="flex items-center justify-center p-8">Loading editor...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document Title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Upload Button */}
            <button
              onClick={triggerFileUpload}
              disabled={isUploading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload Document (DOC, DOCX, TXT, RTF, HTML) (Ctrl+O)"
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
            </button>

            {/* History Button */}
            <button
              onClick={() => setShowHistoryPanel(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <FileText className="h-4 w-4" />
              <span>History</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <span>💾</span>
              )}
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Outdated Warning */}
        {showOutdatedWarning && (
          <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded-md">
            <div className="flex items-center">
              <span className="text-yellow-800">
                ⚠️ This document has been modified by another user. Please refresh to see the latest version.
              </span>
            </div>
          </div>
        )}

        {/* Save Message */}
        {lastSaveMessage && (
          <div className={`mt-3 p-3 rounded-md ${
            lastSaveMessage.includes('✅') 
              ? 'bg-green-100 border border-green-400 text-green-800' 
              : 'bg-red-100 border border-red-400 text-red-800'
          }`}>
            {lastSaveMessage}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".doc,.docx,.txt,.rtf,.html,.htm"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Editor Container */}
      <div 
        className={`relative flex-1 ${isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag & Drop Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-50">
            <div className="text-center text-blue-700 font-semibold">
              <div className="text-2xl mb-2">📄</div>
              <div>Drop your document here</div>
              <div className="text-sm mt-1">Supports DOC, DOCX, TXT, RTF, and HTML files</div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-3">
          <div className="flex items-center space-x-1 flex-wrap gap-2">
            {/* Text Formatting */}
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              disabled={!editor.can().chain().focus().toggleUnderline().run()}
              className={`p-2 rounded ${editor.isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              className={`p-2 rounded ${editor.isActive('strike') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editor.can().chain().focus().toggleCode().run()}
              className={`p-2 rounded ${editor.isActive('code') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Headings */}
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Lists */}
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Block Elements */}
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded ${editor.isActive('blockquote') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Blockquote"
            >
              <Quote className="h-4 w-4" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Text Alignment */}
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className={`p-2 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Justify"
            >
              <AlignJustify className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="bg-white min-h-[600px] p-8">
          <EditorContent editor={editor} className="prose max-w-none" />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <span>Words: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length}</span>
            <span>Characters: {content.replace(/<[^>]*>/g, '').length}</span>
            <span>Last saved: {lastKnownVersion ? `Version ${lastKnownVersion}` : 'Not saved yet'}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportWord}
              disabled={exportingWord}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to Word (Ctrl+Shift+W)"
            >
              {exportingWord ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <span>📄</span>
              )}
              <span>{exportingWord ? 'Exporting...' : 'Export Word'}</span>
            </button>
            
            <button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to PDF (Ctrl+Shift+P)"
            >
              {exportingPDF ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <span>📄</span>
              )}
              <span>{exportingPDF ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* History Panel */}
      {showHistoryPanel && (
        <HistoryPanel
          documentId={documentId}
          isOpen={showHistoryPanel}
          onClose={() => setShowHistoryPanel(false)}
        />
      )}
    </div>
  )
}

export default DocumentEditorWithHistory
