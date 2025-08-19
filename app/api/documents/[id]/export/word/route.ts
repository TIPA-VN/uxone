import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { exportToWord, getExportFilename } from '@/lib/exportService'

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

    // Export to Word
    const wordBuffer = await exportToWord({
      title,
      content,
      author: session.user.name || session.user.username || 'Unknown User',
      company: 'Toshiba Industrial Products Asia'
    })

    // Generate filename
    const filename = getExportFilename(title, 'docx')

    // Return the file
    return new NextResponse(wordBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': wordBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error exporting to Word:', error)
    return NextResponse.json(
      { error: 'Failed to export document to Word' }, 
      { status: 500 }
    )
  }
}
