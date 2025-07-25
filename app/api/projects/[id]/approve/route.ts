import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { department, action } = await req.json(); // action: "approved" | "disapproved"
  if (!department || !["approved", "disapproved"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  // Fetch project
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  // Only allow if user is head of the department (for demo, check user.department === department)
  if (session.user.department !== department) {
    return NextResponse.json({ error: "Not authorized for this department" }, { status: 403 });
  }
  // Update approvalState
  const currentState = typeof project.approvalState === "object" ? project.approvalState : JSON.parse(project.approvalState as string || '{}');
  const approvalState = { ...currentState, [String(department)]: action };
  // If all required departments are approved, set status to "approved"
  // Only use string departments
  const departmentList = Array.isArray(project.departments)
    ? project.departments.filter((d): d is string => typeof d === "string")
    : [];
  const allApproved = departmentList.every((d: string) => approvalState[d] === "approved");
  const status = allApproved ? "approved" : project.status;
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      approvalState,
      status,
    },
  });
  return NextResponse.json(updated);
} 