import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrismaAudit } from "@/lib/prisma-audit";

export const runtime = 'nodejs';

// PATCH /api/projects/[id]/contract - Update contract details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;
    const body = await request.json();
    const {
      contractType,
      counterparty,
      value,
      currency,
      contractStatus,
    } = body;

    // Verify the project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { contractDetails: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has permission to edit this project
    const isOwner = project.ownerId === session.user.id;
    const isManager = ["MANAGER", "SENIOR_MANAGER", "GENERAL_MANAGER", "ADMIN"].includes(session.user.role || "");
    
    if (!isOwner && !isManager) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Update or create contract details
    let updatedContract;
    
    if (project.contractDetails) {
      // Update existing contract details
      updatedContract = await PrismaAudit.updateWithAudit(prisma, prisma.contractDetails, {
        where: { id: project.contractDetails.id },
        data: {
          contractType: contractType || undefined,
          counterparty: counterparty || undefined,
          value: value ? parseFloat(value.toString()) : undefined,
          currency: currency || undefined,
          contractStatus: contractStatus || undefined,
        },
      });
    } else {
      // Create new contract details
      updatedContract = await PrismaAudit.createWithAudit(prisma, prisma.contractDetails, {
        data: {
          projectId: projectId,
          contractType: contractType || undefined,
          counterparty: counterparty || undefined,
          value: value ? parseFloat(value.toString()) : undefined,
          currency: currency || "THB",
          contractStatus: contractStatus || "DRAFT",
          currentApproverId: session.user.id,
          totalApprovalLevels: 3,
          currentApprovalLevel: 1,
          contractNumber: `CON-${new Date().getFullYear()}-${projectId.substring(0, 8).toUpperCase()}`,
        },
      });
    }

    return NextResponse.json(updatedContract);
  } catch (error) {
    console.error("Error updating contract details:", error);
    return NextResponse.json(
      { error: "Failed to update contract details" },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/contract - Get contract details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;

    // Get project with contract details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { contractDetails: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project.contractDetails);
  } catch (error) {
    console.error("Error fetching contract details:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract details" },
      { status: 500 }
    );
  }
}
