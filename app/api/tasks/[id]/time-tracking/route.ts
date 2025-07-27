import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch time tracking data for a task
export async function GET({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { assigneeId: session.user.id },
          { createdBy: session.user.id },
        ],
      },
      select: {
        id: true,
        title: true,
        estimatedHours: true,
        actualHours: true,
        status: true,
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      taskId: task.id,
      title: task.title,
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      status: task.status,
      assignee: task.assignee,
      efficiency: task.estimatedHours && task.actualHours 
        ? Math.round((task.estimatedHours / task.actualHours) * 100)
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

// POST - Start time tracking session
export async function POST({ params, request }: { params: Promise<{ id: string }>, request: NextRequest }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, hours } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // Check if user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { assigneeId: session.user.id },
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

    let updateData: any = {};

    if (action === "update_estimate" && typeof hours === "number") {
      updateData.estimatedHours = hours;
    } else if (action === "update_actual" && typeof hours === "number") {
      updateData.actualHours = hours;
    } else if (action === "add_time" && typeof hours === "number") {
      // Add time to actual hours
      const currentActual = task.actualHours || 0;
      updateData.actualHours = currentActual + hours;
    } else {
      return NextResponse.json(
        { error: "Invalid action or hours value" },
        { status: 400 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        estimatedHours: true,
        actualHours: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: `Time tracking updated successfully`,
    });
  } catch (error) {
    console.error("Error updating time tracking:", error);
    return NextResponse.json(
      { error: "Failed to update time tracking" },
      { status: 500 }
    );
  }
}

// PATCH - Update time tracking data
export async function PATCH({ params, request }: { params: Promise<{ id: string }>, request: NextRequest }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { estimatedHours, actualHours } = await request.json();

    // Check if user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { assigneeId: session.user.id },
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

    const updateData: any = {};
    if (typeof estimatedHours === "number") {
      updateData.estimatedHours = estimatedHours;
    }
    if (typeof actualHours === "number") {
      updateData.actualHours = actualHours;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid time data provided" },
        { status: 400 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        estimatedHours: true,
        actualHours: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: "Time tracking updated successfully",
    });
  } catch (error) {
    console.error("Error updating time tracking:", error);
    return NextResponse.json(
      { error: "Failed to update time tracking" },
      { status: 500 }
    );
  }
} 