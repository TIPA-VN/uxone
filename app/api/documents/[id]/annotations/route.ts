import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { checkDocumentAccess } from "@/lib/documentAccess";

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  
  try {
    // Fetch document with project info for access control
    const document = await prisma.document.findUnique({
      where: { id },
      include: { project: true },
      select: { 
        id: true,
        annotations: true,
        workflowState: true,
        metadata: true,
        ownerId: true,
        department: true,
        project: { select: { ownerId: true } }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check document access using the access control system
    const accessResult = checkDocumentAccess(document, session.user);
    
    if (!accessResult.canAccess) {
      return NextResponse.json({ 
        error: accessResult.reason || "Not authorized to access this document" 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      canvasData: document.annotations || null 
    });
  } catch (error) {
    console.error('Error fetching annotations:', error);
    return NextResponse.json({ error: "Failed to fetch annotations" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { canvasData } = await req.json();

  if (!canvasData) {
    return NextResponse.json({ error: "Canvas data is required" }, { status: 400 });
  }

  try {
    // Fetch document with project info for access control
    const document = await prisma.document.findUnique({
      where: { id },
      include: { project: true },
      select: { 
        id: true,
        workflowState: true,
        metadata: true,
        ownerId: true,
        department: true,
        project: { select: { ownerId: true } }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check document access using the access control system
    const accessResult = checkDocumentAccess(document, session.user);
    
    if (!accessResult.canAccess) {
      return NextResponse.json({ 
        error: accessResult.reason || "Not authorized to modify this document" 
      }, { status: 403 });
    }

    // Prevent modifications to production documents
    if (document.workflowState === "production") {
      return NextResponse.json({ 
        error: "Cannot modify production documents" 
      }, { status: 400 });
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: { annotations: canvasData },
      select: { id: true, annotations: true }
    });

    return NextResponse.json({ 
      success: true, 
      annotations: updatedDocument.annotations 
    });
  } catch (error) {
    console.error('Error saving annotations:', error);
    return NextResponse.json({ error: "Failed to save annotations" }, { status: 500 });
  }
} 