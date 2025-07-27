import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 401 });
    }

    const { id } = await params;

    const comments = await prisma.taskComment.findMany({
      where: { taskId: id },
      orderBy: { timestamp: 'asc' }
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching task comments:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    // Verify task access
    const task = await prisma.$queryRawUnsafe(`
      SELECT * FROM tasks 
      WHERE id = '${id}' AND (
        "ownerId" = '${session.user.id}' OR 
        "assigneeId" = '${session.user.id}' OR 
        '${session.user.department}' = ANY("assignedDepartments")
      )
    `);

    if (!task || (Array.isArray(task) && task.length === 0)) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        text,
        authorId: session.user.id,
        author: session.user.name || session.user.username,
      }
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating task comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
} 