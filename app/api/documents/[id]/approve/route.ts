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



    // Check if user has approval permissions based on role level
    const userRole = session.user.role?.toUpperCase() || 'STAFF';
    
    // Define roles that can approve documents (Level 4 and above - Manager level and above)
    const canApproveRoles = [
      'ADMIN',
      'GENERAL_DIRECTOR', 'GENERAL_MANAGER',
      'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2',
      'SENIOR_MANAGER', 'SENIOR_MANAGER_2', 'ASSISTANT_SENIOR_MANAGER',
      'MANAGER', 'MANAGER_2', 'ASSISTANT_MANAGER', 'ASSISTANT_MANAGER_2'
    ];
    
    const canApprove = canApproveRoles.includes(userRole);
    
    if (!canApprove) {
      return NextResponse.json({ 
        error: "Insufficient permissions to approve documents",
        message: `Your role (${userRole}) does not have document approval permissions. Required: Manager level or above (Level 4+). Supervisor level roles can only read documents.`,
        userRole: userRole
      }, { status: 403 });
    }

    // For non-executive users, check if they are authorized for this document's department
    const isExecutive = ['ADMIN', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2'].includes(userRole);
    const userDept = (session.user.department || '').toUpperCase();
    const docDept = (document.department || '').toUpperCase();
    
    // Only check department for non-executive users
    if (!isExecutive && userDept !== docDept) {
      return NextResponse.json({ 
        error: "Not authorized for this department",
        message: `You can only approve documents from your department (${userDept}). This document belongs to ${docDept}.`,
        userDepartment: userDept,
        documentDepartment: docDept
      }, { status: 403 });
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