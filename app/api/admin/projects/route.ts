import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and has admin access
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAdminRole = ['ADMIN', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'SENIOR_MANAGER'].includes(session.user.role || '');
    const isISDepartment = session.user.department === 'IS';
    
    if (!hasAdminRole && !isISDepartment) {
      return NextResponse.json({ error: "Access denied. Admin privileges or IS department access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const ownerId = searchParams.get("ownerId");
    const memberId = searchParams.get("memberId");

    const where: any = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by owner
    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Filter by team member
    if (memberId) {
      where.members = {
        some: {
          userId: memberId,
        },
      };
    }

    // Get all projects with related data counts
    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
            comments: true,
            members: true,
            documentNumbers: true,
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching admin projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
