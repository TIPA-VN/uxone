import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tasks/[id]/dependencies - Get task dependencies
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
      include: {
        dependencies: {
          include: {
            blockingTask: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            },
          },
        },
        blockingTasks: {
          include: {
            dependentTask: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      dependencies: task.dependencies,
      blockingTasks: task.blockingTasks,
    });
  } catch (error) {
    console.error("Error fetching task dependencies:", error);
    return NextResponse.json(
      { error: "Failed to fetch task dependencies" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/dependencies - Add a dependency
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
    const { blockingTaskId } = body;

    if (!blockingTaskId) {
      return NextResponse.json(
        { error: "Blocking task ID is required" },
        { status: 400 }
      );
    }

    // Verify task access
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
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

    // Verify blocking task exists
    const blockingTask = await prisma.task.findUnique({
      where: { id: blockingTaskId },
    });

    if (!blockingTask) {
      return NextResponse.json(
        { error: "Blocking task not found" },
        { status: 404 }
      );
    }

    // Prevent self-dependency
    if (params.id === blockingTaskId) {
      return NextResponse.json(
        { error: "Task cannot depend on itself" },
        { status: 400 }
      );
    }

    // Check for circular dependencies
    const wouldCreateCycle = await checkForCircularDependency(
      params.id,
      blockingTaskId
    );

    if (wouldCreateCycle) {
      return NextResponse.json(
        { error: "Adding this dependency would create a circular reference" },
        { status: 400 }
      );
    }

    const dependency = await prisma.taskDependency.create({
      data: {
        dependentTaskId: params.id,
        blockingTaskId,
      },
      include: {
        blockingTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
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

// DELETE /api/tasks/[id]/dependencies - Remove a dependency
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Verify task access
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
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

    const deletedDependency = await prisma.taskDependency.deleteMany({
      where: {
        dependentTaskId: params.id,
        blockingTaskId,
      },
    });

    if (deletedDependency.count === 0) {
      return NextResponse.json(
        { error: "Dependency not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Dependency removed successfully" });
  } catch (error) {
    console.error("Error removing task dependency:", error);
    return NextResponse.json(
      { error: "Failed to remove task dependency" },
      { status: 500 }
    );
  }
}

// Helper function to check for circular dependencies
async function checkForCircularDependency(
  dependentTaskId: string,
  blockingTaskId: string
): Promise<boolean> {
  const visited = new Set<string>();
  const stack = new Set<string>();

  async function hasCycle(taskId: string): Promise<boolean> {
    if (stack.has(taskId)) {
      return true;
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
      if (await hasCycle(dep.blockingTaskId)) {
        return true;
      }
    }
    
    stack.delete(taskId);
    return false;
  }

  return hasCycle(blockingTaskId);
} 