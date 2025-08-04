import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs';

export async function PATCH(
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

    // Production endpoint processing

    // Fetch document with project info
    const document = await prisma.document.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Document found

    // Check if document is approved
    const metadata = typeof document.metadata === 'object' ? document.metadata : {};
    if (!metadata || typeof metadata !== 'object' || !('approved' in metadata) || !metadata.approved) {
      // Document not approved
      return NextResponse.json({ error: "Document must be approved before sending to production" }, { status: 400 });
    }

    // Check if user is department head for this document's department
    const userDept = (session.user.department || '').toUpperCase();
    const docDept = (document.department || '').toUpperCase();
    
    // Department comparison

    if (userDept !== docDept) {
      // Department mismatch
      return NextResponse.json({ error: "Not authorized for this department" }, { status: 403 });
    }

    // Check if user has production promotion permissions (SENIOR MANAGER or ADMIN)
    const isAdmin = session.user.role?.toUpperCase() === "ADMIN";
    const isSeniorManager = session.user.role?.toUpperCase() === "SENIOR MANAGER" || 
                           session.user.role?.toUpperCase() === "SENIOR_MANAGER";
    
    // Permission check

    if (!isAdmin && !isSeniorManager) {
      // Insufficient permissions
      return NextResponse.json({ error: "Insufficient permissions to promote documents to production" }, { status: 403 });
    }

    // All checks passed - proceeding with production update

    // Update document to mark as production
    const updatedMetadata = {
      ...metadata,
      production: true,
      productionBy: session.user.username || session.user.name || session.user.id,
      productionAt: new Date().toISOString()
    };

    const updated = await prisma.document.update({
      where: { id },
      data: {
        workflowState: "production",
        metadata: updatedMetadata
      }
    });

    // Create notification for document owner
    if (document.ownerId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: document.ownerId,
          title: `Document Sent to Production`,
          message: `Your document "${document.fileName}" has been promoted to production by ${session.user.name || session.user.username}`,
          type: "success",
          link: `/lvm/projects/${document.projectId}`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Document production promotion error:", error);
    return NextResponse.json(
      { error: "Failed to promote document to production" },
      { status: 500 }
    );
  }
} 