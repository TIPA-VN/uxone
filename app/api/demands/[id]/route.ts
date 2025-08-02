import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    // Fetch demand with all related data
    const demand = await prisma.demand.findUnique({
      where: { id: demandId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            email: true,
          },
        },
        demandLines: {
          select: {
            id: true,
            itemDescription: true,
            quantity: true,
            estimatedCost: true,
            unitOfMeasure: true,
            specifications: true,
            supplierPreference: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            demandLines: true,
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

    // Check if user has permission to view this demand
    const userDepartment = session.user.department || session.user.centralDepartment;
    const userRole = session.user.role?.toUpperCase() || "";
    
    // Admin can view all demands
    if (userRole.includes("ADMIN")) {
      return NextResponse.json({ demand });
    }
    
    // User can view their own demands
    if (demand.userId === session.user.id) {
      return NextResponse.json({ demand });
    }
    
    // Managers can view demands from their department
    if (userRole.includes("MANAGER") || userRole.includes("DIRECTOR") || userRole.includes("SUPERVISOR")) {
      if (userDepartment === demand.department) {
        return NextResponse.json({ demand });
      }
    }
    
    // PROC team can view all demands
    if (userDepartment === "PROC") {
      return NextResponse.json({ demand });
    }

    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 }
    );

  } catch (error) {
    console.error("Error fetching demand:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 