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

export async function PATCH(req: NextRequest, context: any) {
  const { params } = await context;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      where: { id: params.id },
      include: { owner: true }
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if ((session.user.department || '').toUpperCase() !== (department || '').toUpperCase()) {
      return NextResponse.json({ error: "Not authorized for this department" }, { status: 403 });
    }

    // Prevent approval/disapproval if project is released
    if (project.released) {
      return NextResponse.json({ error: "Project is already released and cannot be modified." }, { status: 403 });
    }

    // Ensure approvalState is always initialized as an object
    const currentState = !project.approvalState
      ? {}
      : typeof project.approvalState === "object"
        ? project.approvalState
        : JSON.parse(String(project.approvalState) || '{}');

    // Log all approvals/rejects as an array per department
    const prevLogs = Array.isArray(currentState[department]) ? currentState[department] : [];
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

    // Calculate new status
    const departmentList = project.departments as string[];
    // For new log format, get latest status for each department
    const getLatestStatus = (logs: any) => Array.isArray(logs) && logs.length > 0 ? logs[logs.length - 1].status : logs;
    const allApproved = departmentList.every(d => getLatestStatus(approvalState[d]) === "APPROVED");
    const anyDisapproved = departmentList.some(d => getLatestStatus(approvalState[d]) === "REJECTED");
    const status = allApproved ? "APPROVED" : anyDisapproved ? "REJECTED" : "PENDING";

    // Update project
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        approvalState,
        status,
        ...(status === "APPROVED" ? { released: true, releasedAt: new Date() } : {})
      },
    });

    // Create notification
    console.log("Creating notification for project:", project.id);
    console.log("Project owner ID:", project.ownerId);
    console.log("Action:", actionUpper);
    console.log("Department:", department);
    
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: project.ownerId,
          title: `Project ${actionUpper === "APPROVED" ? "Approved" : "Disapproved"} by ${department.charAt(0).toUpperCase() + department.slice(1)}`,
          message: `${department.charAt(0).toUpperCase() + department.slice(1)} has ${actionUpper} project "${project.name}"${status === "APPROVED" ? ". All approvals complete!" : ""}`,
          type: actionUpper === "APPROVED" ? "success" : "warning",
          link: `/lvm/projects/${project.id}`,
        },
      });
      console.log("Notification created successfully:", notification.id);
      
      // Send notification through SSE
      sendNotification(notification, project.ownerId);
    } catch (error) {
      console.error("Error creating notification:", error);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Project approval error:", error);
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
} 