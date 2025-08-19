import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { saveDocumentWithHistory } from "@/lib/historyService";
import * as fs from "fs/promises";
import * as path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    // Import prisma here to avoid circular dependencies
    const { prisma } = await import('@/lib/prisma')
    
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        content: document.content,
        version: document.version,
        workflowState: document.workflowState,
        lastUpdatedBy: document.lastUpdatedBy,
        lastUpdatedById: document.lastUpdatedById,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }
    })

  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' }, 
      { status: 500 }
    )
  }
}

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
    const { content, title, status } = await req.json();
    
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
        workflowState: status || currentDoc.workflowState,
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
        wordCount: content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    // Fetch document with project info
    const document = await prisma.document.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if user is project owner
    if (document.project?.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owner can delete documents" }, { status: 403 });
    }

    // Check if document is in production (read-only)
    if (document.workflowState === "production") {
      return NextResponse.json({ error: "Cannot delete production documents" }, { status: 400 });
    }

    // Delete the file from disk
    try {
      const filePath = path.join(process.cwd(), "public", document.filePath);
      await fs.unlink(filePath);
    } catch (error) {
      console.error("Failed to delete file from disk:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete the document from database
    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Document deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
} 