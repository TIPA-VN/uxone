import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 401 });
    }

    // Get tasks where user is owner, assignee, or belongs to assigned department
    const tasks = await prisma.$queryRawUnsafe(`
      SELECT 
        t.*,
        o.name as owner_name,
        o.username as owner_username,
        o.department as owner_department,
        a.name as assignee_name,
        a.username as assignee_username,
        a.department as assignee_department,
        p.name as project_name
      FROM tasks t
      LEFT JOIN users o ON t."ownerId" = o.id
      LEFT JOIN users a ON t."assigneeId" = a.id
      LEFT JOIN projects p ON t."projectId" = p.id
      WHERE 
        t."ownerId" = '${session.user.id}' OR 
        t."assigneeId" = '${session.user.id}' OR 
        '${session.user.department}' = ANY(t."assignedDepartments")
      ORDER BY t."createdAt" DESC
    `);

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      assigneeId,
      assignedDepartments,
      priority,
      dueDate,
      projectId
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        ownerId: session.user.id,
        assigneeId: assigneeId || null,
        assignedDepartments: assignedDepartments || [],
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
      },
      include: {
        owner: true,
        assignee: true,
        project: true,
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Verify task ownership or assignment
    const existingTask = await prisma.$queryRawUnsafe(`
      SELECT * FROM tasks 
      WHERE id = '${id}' AND (
        "ownerId" = '${session.user.id}' OR 
        "assigneeId" = '${session.user.id}' OR 
        '${session.user.department}' = ANY("assignedDepartments")
      )
    `);

    if (!existingTask || (Array.isArray(existingTask) && existingTask.length === 0)) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }

    // Handle status changes
    if (updateData.status === 'COMPLETED' && !updateData.finishedDate) {
      updateData.finishedDate = new Date();
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        owner: true,
        assignee: true,
        project: true,
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Verify task ownership
    const existingTask = await prisma.$queryRawUnsafe(`
      SELECT * FROM tasks 
      WHERE id = '${id}' AND "ownerId" = '${session.user.id}'
    `);

    if (!existingTask || (Array.isArray(existingTask) && existingTask.length === 0)) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }

    // Delete task (cascade will handle attachments and comments)
    await prisma.task.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
} 