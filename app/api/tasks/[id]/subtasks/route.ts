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

    // Verify task access (owner, assignee, creator, or senior manager of same department)
    const task = await prisma.task.findFirst({
      where: {
        id,
      },
      include: {
        owner: {
          select: {
            id: true,
            department: true,
          },
        },
        assignee: {
          select: {
            id: true,
            department: true,
          },
        },
        creator: {
          select: {
            id: true,
            department: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check access: user can access if they are owner, assignee, creator, or senior manager of same department
    const userDepartment = session.user.department || session.user.centralDepartment;
    const userRole = session.user.role;
    const isSeniorManager = userRole === 'SENIOR_MANAGER';
    const isAdmin = ['ADMIN', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2'].includes(userRole || '');
    
    const hasDirectAccess = task.ownerId === session.user.id || 
                           task.assigneeId === session.user.id || 
                           task.creatorId === session.user.id;
    
    const hasDepartmentAccess = isSeniorManager && userDepartment && (
      task.owner?.department === userDepartment ||
      task.assignee?.department === userDepartment ||
      task.creator?.department === userDepartment
    );
    
    const hasAdminAccess = isAdmin;

    if (!hasDirectAccess && !hasDepartmentAccess && !hasAdminAccess) {
      console.log(`❌ Access denied for subtasks ${id}: user ${session.user.id} (${userRole}, ${userDepartment}) cannot access task from department ${task.owner?.department || task.assignee?.department || task.creator?.department}`);
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    console.log(`✅ Access granted for subtasks ${id}: user ${session.user.id} (${userRole}, ${userDepartment})`);

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