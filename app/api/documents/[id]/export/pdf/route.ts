import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { exportToPDF, getExportFilename } from '@/lib/exportService'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { content, title } = await req.json()

    if (!content || !title) {
      return NextResponse.json(
        { error: 'Content and title are required' }, 
        { status: 400 }
      )
    }

    // Export to PDF (returns HTML content for now)
    const htmlBuffer = await exportToPDF({
      title,
      content,
      author: session.user.name || session.user.username || 'Unknown User'
    })

    // Generate filename
    const filename = getExportFilename(title, 'pdf')

    // Return the HTML content with instructions for PDF conversion
    // Users can open this in a browser and use Print > Save as PDF
    return new NextResponse(htmlBuffer, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename.replace('.pdf', '.html')}"`,
        'Content-Length': htmlBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error exporting to PDF:', error)
    return NextResponse.json(
      { error: 'Failed to export document to PDF' }, 
      { status: 500 }
    )
  }
}
