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

    // Fetch document with project info
    const document = await prisma.document.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if user is department head for this document's department
    if ((session.user.department || '').toUpperCase() !== (document.department || '').toUpperCase()) {
      return NextResponse.json({ error: "Not authorized for this department" }, { status: 403 });
    }

    // Check if user has approval permissions (SENIOR MANAGER or ADMIN)
    const isAdmin = session.user.role?.toUpperCase() === "ADMIN";
    const isSeniorManager = session.user.role?.toUpperCase() === "SENIOR MANAGER";
    if (!isAdmin && !isSeniorManager) {
      return NextResponse.json({ error: "Insufficient permissions to approve documents" }, { status: 403 });
    }

    // Update document metadata to mark as approved
    const currentMetadata = typeof document.metadata === 'object' ? document.metadata : {};
    const updatedMetadata = {
      ...currentMetadata,
      approved: true,
      approvedBy: session.user.username || session.user.name || session.user.id,
      approvedAt: new Date().toISOString()
    };

    const updated = await prisma.document.update({
      where: { id },
      data: {
        metadata: updatedMetadata
      }
    });

    // Create notification for document owner
    if (document.ownerId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: document.ownerId,
          title: `Document Approved`,
          message: `Your document "${document.fileName}" has been approved by ${session.user.name || session.user.username}`,
          type: "success",
          link: `/lvm/projects/${document.projectId}`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Document approval error:", error);
    return NextResponse.json(
      { error: "Failed to approve document" },
      { status: 500 }
    );
  }
} 