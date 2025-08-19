import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { content, title } = await req.json();
    
    if (!content || !title) {
      return NextResponse.json(
        { error: 'Content and title are required' }, 
        { status: 400 }
      );
    }

    // Import prisma here to avoid circular dependencies
    const { prisma } = await import('@/lib/prisma')
    
    // Get current document
    const currentDoc = await prisma.document.findUnique({
      where: { id }
    });

    if (!currentDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update document
    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        content,
        title,
        version: { increment: 1 },
        lastUpdatedBy: session.user.id,
        lastUpdatedById: session.user.id
      }
    });

    // Create history entry
    const latestHistory = await prisma.documentHistory.findFirst({
      where: { documentId: id },
      orderBy: { version: 'desc' },
      take: 1
    });

    const newVersion = latestHistory?.version + 1 || 1;
    
    await prisma.documentHistory.create({
      data: {
        documentId: id,
        content,
        title,
        changeType: 'updated',
        summary: `Document updated by ${session.user.name || session.user.username || 'Unknown User'}`,
        changedBy: session.user.id,
        changedByName: session.user.name || session.user.username || 'Unknown User',
        changedByEmail: session.user.email || 'unknown@example.com',
        version: newVersion,
        wordCount: content.replace(/<[^>]*>/g, '').split(/\s+/).filter((word: string) => word.length > 0).length
      }
    });

    return NextResponse.json({
      success: true,
      document: updatedDoc,
      message: 'Document saved successfully with history tracking'
    });

  } catch (error) {
    console.error('Error saving document:', error);
    return NextResponse.json(
      { error: 'Failed to save document' }, 
      { status: 500 }
    );
  }
}
