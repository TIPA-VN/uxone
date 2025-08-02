import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const demandId = params.id;
    const { action, comment } = await request.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Fetch the demand to check permissions
    const demand = await prisma.demand.findUnique({
      where: { id: demandId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!demand) {
      return NextResponse.json(
        { error: "Demand not found" },
        { status: 404 }
      );
    }

    // Check if demand is in pending status
    if (demand.status !== "PENDING") {
      return NextResponse.json(
        { error: "Demand is not in pending status" },
        { status: 400 }
      );
    }

    // Check if user has permission to approve this demand
    const userDepartment = session.user.department || session.user.centralDepartment;
    const userRole = session.user.role?.toUpperCase() || "";
    
    let canApprove = false;
    
    // Admin can approve anything
    if (userRole.includes("ADMIN")) {
      canApprove = true;
    }
    
    // Manager roles can approve
    if (userRole.includes("MANAGER") || userRole.includes("DIRECTOR")) {
      canApprove = true;
    }
    
    // Department head can approve demands from their department
    if (userDepartment === demand.department && userRole.includes("SUPERVISOR")) {
      canApprove = true;
    }
    
    // PROC team can approve all demands
    if (userDepartment === "PROC") {
      canApprove = true;
    }

    if (!canApprove) {
      return NextResponse.json(
        { error: "Access denied. You don't have permission to approve this demand." },
        { status: 403 }
      );
    }

    // Update demand status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (action === 'approve') {
      updateData.approvedAt = new Date();
    }

    const updatedDemand = await prisma.demand.update({
      where: { id: demandId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        demandLines: true,
      },
    });

    // Update all demand lines status
    await prisma.demandLine.updateMany({
      where: { demandId },
      data: { status: newStatus },
    });

    // Create a notification for the demand creator
    await prisma.notification.create({
      data: {
        userId: demand.userId,
        title: `Demand ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: `Your demand ${demandId} has been ${action === 'approve' ? 'approved' : 'rejected'}${comment ? ` with comment: ${comment}` : ''}.`,
        type: action === 'approve' ? 'SUCCESS' : 'WARNING',
        read: false,
      },
    });

    // Log the approval action
    console.log(`Demand ${demandId} ${action}ed by ${session.user.name} (${session.user.id}) at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Demand successfully ${action}ed`,
      demand: updatedDemand,
    });

  } catch (error) {
    console.error("Error approving/rejecting demand:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 