import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tasks/[id]/time-tracking - Get time tracking data for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        estimatedHours: true,
        actualHours: true,
        status: true,
        assigneeId: true,
        ownerId: true,
        createdBy: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user has access to this task
    const hasAccess = 
      task.assigneeId === session.user.id ||
      task.ownerId === session.user.id ||
      task.createdBy === session.user.id;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      taskId: task.id,
      taskTitle: task.title,
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      status: task.status,
      efficiency: task.estimatedHours && task.actualHours 
        ? (task.actualHours / task.estimatedHours) * 100 
        : null,
    });
  } catch (error) {
    console.error("Error fetching time tracking data:", error);
    return NextResponse.json(
      { error: "Failed to fetch time tracking data" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/time-tracking - Log time for a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { hours, description, date } = body;

    if (!hours || hours <= 0) {
      return NextResponse.json(
        { error: "Valid hours are required" },
        { status: 400 }
      );
    }

    // Verify task exists and user has access
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        OR: [
          { assigneeId: session.user.id },
          { ownerId: session.user.id },
          { createdBy: session.user.id },
        ],
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    // Update task's actual hours
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        actualHours: {
          increment: hours,
        },
      },
      select: {
        id: true,
        title: true,
        estimatedHours: true,
        actualHours: true,
        status: true,
      },
    });

    // Create a comment to log the time entry
    const timeComment = await prisma.comment.create({
      data: {
        content: `⏱️ Time logged: ${hours} hours${description ? ` - ${description}` : ""}`,
        authorId: session.user.id,
        taskId: params.id,
        mentions: [],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            departmentName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Time logged successfully",
      task: updatedTask,
      timeEntry: timeComment,
    }, { status: 201 });
  } catch (error) {
    console.error("Error logging time:", error);
    return NextResponse.json(
      { error: "Failed to log time" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id]/time-tracking - Update estimated hours
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { estimatedHours } = body;

    if (estimatedHours === undefined || estimatedHours < 0) {
      return NextResponse.json(
        { error: "Valid estimated hours are required" },
        { status: 400 }
      );
    }

    // Verify task exists and user has access
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: session.user.id },
          { createdBy: session.user.id },
        ],
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    // Update estimated hours
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        estimatedHours,
      },
      select: {
        id: true,
        title: true,
        estimatedHours: true,
        actualHours: true,
        status: true,
      },
    });

    return NextResponse.json({
      message: "Estimated hours updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating estimated hours:", error);
    return NextResponse.json(
      { error: "Failed to update estimated hours" },
      { status: 500 }
    );
  }
} 