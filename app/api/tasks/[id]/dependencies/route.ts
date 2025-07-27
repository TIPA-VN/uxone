import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch task dependencies
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
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch dependencies (tasks that this task depends on)
    const dependencies = await prisma.taskDependency.findMany({
      where: { dependentTaskId: id },
      include: {
        blockingTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assignee: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch blocking tasks (tasks that depend on this task)
    const blockingTasks = await prisma.taskDependency.findMany({
      where: { blockingTaskId: id },
      include: {
        dependentTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assignee: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      dependencies: dependencies.map(d => ({
        id: d.id,
        blockingTask: d.blockingTask,
        createdAt: d.createdAt,
      })),
      blockingTasks: blockingTasks.map(d => ({
        id: d.id,
        dependentTask: d.dependentTask,
        createdAt: d.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching task dependencies:", error);
    return NextResponse.json(
      { error: "Failed to fetch task dependencies" },
      { status: 500 }
    );
  }
}

// POST - Create a new dependency
export async function POST({ params, request }: { params: Promise<{ id: string }>, request: NextRequest }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { blockingTaskId } = await request.json();

    if (!blockingTaskId) {
      return NextResponse.json(
        { error: "Blocking task ID is required" },
        { status: 400 }
      );
    }

    // Check if user has access to the dependent task
    const dependentTask = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { assigneeId: session.user.id },
          { createdBy: session.user.id },
        ],
      },
    });

    if (!dependentTask) {
      return NextResponse.json(
        { error: "Dependent task not found or access denied" },
        { status: 404 }
      );
    }

    // Check if blocking task exists
    const blockingTask = await prisma.task.findUnique({
      where: { id: blockingTaskId },
    });

    if (!blockingTask) {
      return NextResponse.json(
        { error: "Blocking task not found" },
        { status: 404 }
      );
    }

    // Check for circular dependencies
    const hasCycle = await checkForCircularDependency(id, blockingTaskId);
    if (hasCycle) {
      return NextResponse.json(
        { error: "Circular dependency detected" },
        { status: 400 }
      );
    }

    // Create the dependency
    const dependency = await prisma.taskDependency.create({
      data: {
        dependentTaskId: id,
        blockingTaskId,
      },
      include: {
        blockingTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assignee: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(dependency, { status: 201 });
  } catch (error) {
    console.error("Error creating task dependency:", error);
    return NextResponse.json(
      { error: "Failed to create task dependency" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a dependency
export async function DELETE({ params, request }: { params: Promise<{ id: string }>, request: NextRequest }) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blockingTaskId = searchParams.get("blockingTaskId");

    if (!blockingTaskId) {
      return NextResponse.json(
        { error: "Blocking task ID is required" },
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

    // Delete the dependency
    await prisma.taskDependency.delete({
      where: {
        dependentTaskId_blockingTaskId: {
          dependentTaskId: id,
          blockingTaskId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task dependency:", error);
    return NextResponse.json(
      { error: "Failed to delete task dependency" },
      { status: 500 }
    );
  }
}

// Helper function to check for circular dependencies
async function checkForCircularDependency(dependentTaskId: string, blockingTaskId: string): Promise<boolean> {
  const visited = new Set<string>();
  const stack = new Set<string>();

  async function dfs(taskId: string): Promise<boolean> {
    if (stack.has(taskId)) {
      return true; // Circular dependency found
    }
    if (visited.has(taskId)) {
      return false;
    }

    visited.add(taskId);
    stack.add(taskId);

    // Get all tasks that this task depends on
    const dependencies = await prisma.taskDependency.findMany({
      where: { dependentTaskId: taskId },
      select: { blockingTaskId: true },
    });

    for (const dep of dependencies) {
      if (await dfs(dep.blockingTaskId)) {
        return true;
      }
    }

    stack.delete(taskId);
    return false;
  }

  return dfs(blockingTaskId);
} 