import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the project to check ownership
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only project owner can update due dates
    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owner can update due dates" }, { status: 403 });
    }

    const body = await request.json();
    const { requestDate, departmentDueDates } = body;

    // Validate dates
    if (requestDate && isNaN(Date.parse(requestDate))) {
      return NextResponse.json({ error: "Invalid request date format" }, { status: 400 });
    }

    if (departmentDueDates) {
      for (const [dept, date] of Object.entries(departmentDueDates)) {
        if (date && isNaN(Date.parse(date as string))) {
          return NextResponse.json({ error: `Invalid date format for department ${dept}` }, { status: 400 });
        }
      }
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        requestDate: requestDate ? new Date(requestDate) : null,
        departmentDueDates: departmentDueDates || {},
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating due dates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 