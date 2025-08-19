import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { content, title, forceOverwrite, conflictResolution } = await req.json()

    if (!content || !title) {
      return NextResponse.json(
        { error: 'Content and title are required' }, 
        { status: 400 }
      )
    }

    if (!forceOverwrite) {
      return NextResponse.json(
        { error: 'Force save requires forceOverwrite flag' }, 
        { status: 400 }
      )
    }

    // Get current document
    const currentDoc = await prisma.document.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    })

    if (!currentDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Force update the document
    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        content,
        title,
        version: { increment: 1 },
        lastUpdatedBy: session.user.id,
        lastUpdatedById: session.user.id
      }
    })

    // Create history entry for the forced save
    const newVersion = currentDoc.history[0]?.version + 1 || 1
    
    await prisma.documentHistory.create({
      data: {
        documentId: id,
        content,
        title,
        changeType: 'updated',
        summary: `Document updated with conflict resolution (${conflictResolution})`,
        changedBy: session.user.id,
        changedByName: session.user.name || session.user.username || 'Unknown User',
        changedByEmail: session.user.email || 'unknown@example.com',
        version: newVersion,
        wordCount: content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
      }
    })

    return NextResponse.json({
      success: true,
      document: updatedDoc,
      message: 'Document force-saved successfully after conflict resolution'
    })

  } catch (error) {
    console.error('Error force-saving document:', error)
    return NextResponse.json(
      { error: 'Failed to force-save document' }, 
      { status: 500 }
    )
  }
}
