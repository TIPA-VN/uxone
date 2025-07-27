import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tasks/[id]/subtasks - Get all sub-tasks of a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify task access (owner, assignee, or creator)
    const task = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { assigneeId: session.user.id },
          { creatorId: session.user.id },
        ],
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }

    // Get all sub-tasks
    const subtasks = await prisma.task.findMany({
      where: {
        parentTaskId: id,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            departmentName: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            departmentName: true,
          },
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(subtasks);
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
} 