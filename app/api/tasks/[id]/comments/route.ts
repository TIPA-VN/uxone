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
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Transform the data to match frontend expectations
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      taskId: comment.taskId,
      text: comment.content,
      authorId: comment.authorId,
      author: comment.author.name || comment.author.username || 'Unknown User',
      timestamp: comment.createdAt
    }));

    return NextResponse.json(transformedComments);
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

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        content: text,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    // Transform the data to match frontend expectations
    const transformedComment = {
      id: comment.id,
      taskId: comment.taskId,
      text: comment.content,
      authorId: comment.authorId,
      author: comment.author.name || comment.author.username || 'Unknown User',
      timestamp: comment.createdAt
    };

    return NextResponse.json(transformedComment);
  } catch (error) {
    console.error('Error creating task comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
} 