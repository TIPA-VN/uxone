import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const projectId = params.id;

    // Get project with detailed counts of all related data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
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
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      project,
      relatedData: project._count,
    });
  } catch (error) {
    console.error("Error fetching project details:", error);
    return NextResponse.json(
      { error: "Failed to fetch project details" },
      { status: 500 }
    );
  }
}
