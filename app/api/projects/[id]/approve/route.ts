import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendNotification } from "@/app/api/notifications/stream/route";

export const runtime = 'nodejs';

type ApprovalAction = "approved" | "disapproved";

interface ApprovalRequest {
  department: string;
  action: ApprovalAction;
}

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
    const { department, action } = await req.json() as ApprovalRequest;
    let actionUpper = action?.toUpperCase?.() || '';
    // Accept both 'approved'/'disapproved' and 'APPROVED'/'REJECTED'
    if (actionUpper === 'DISAPPROVED') actionUpper = 'REJECTED';
    if (actionUpper === 'APPROVED') actionUpper = 'APPROVED';

    if (!department || !["APPROVED", "REJECTED"].includes(actionUpper)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Fetch project with owner
    const project = await prisma.project.findUnique({
      where: { id },
      include: { owner: true }
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if ((session.user.department || '').toUpperCase() !== (department || '').toUpperCase()) {
      return NextResponse.json({ error: "Not authorized for this department" }, { status: 403 });
    }

    // Check if this department has already approved/disapproved this project
    const currentState = !project.approvalState
      ? {}
      : typeof project.approvalState === "object"
        ? project.approvalState
        : JSON.parse(String(project.approvalState) || '{}');
    
    const departmentApprovals = currentState[department] || [];
    if (departmentApprovals.length > 0) {
      return NextResponse.json({ error: "This department has already provided approval feedback for this project." }, { status: 403 });
    }

    // Log all approvals/rejects as an array per department
    const prevLogs = departmentApprovals;
    const approvalState = {
      ...currentState,
      [department]: [
        ...prevLogs,
        {
          status: actionUpper,
          timestamp: new Date().toISOString(),
          user: session.user.username || session.user.name || session.user.id
        }
      ]
    };

    // Update project - only update approvalState, not the project status
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        approvalState
      },
    });

    // Create notification
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: project.ownerId,
          title: `Project ${actionUpper === "APPROVED" ? "Approved" : "Disapproved"} by ${department.charAt(0).toUpperCase() + department.slice(1)}`,
          message: `${department.charAt(0).toUpperCase() + department.slice(1)} has ${actionUpper} project "${project.name}".`,
          type: actionUpper === "APPROVED" ? "success" : "warning",
          link: `/lvm/projects/${project.id}`,
        },
      });
      
      // Send notification through SSE
      sendNotification(notification, project.ownerId);
    } catch (error) {
      console.error("Error creating notification:", error);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Project approval error:", error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: "Database constraint violation",
          details: "A unique constraint was violated during the update."
        }, { status: 400 });
      }
      if (error.code === 'P2025') {
        return NextResponse.json({ 
          error: "Project not found",
          details: "The project could not be found for updating."
        }, { status: 404 });
      }
    }
    
    return NextResponse.json(
      { error: "Failed to process approval", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 