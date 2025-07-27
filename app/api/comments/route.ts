import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/comments - Get comments with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const projectId = searchParams.get("projectId");
    const parentCommentId = searchParams.get("parentCommentId");
    const includeReplies = searchParams.get("includeReplies") === "true";

    if (!taskId && !projectId) {
      return NextResponse.json(
        { error: "Either taskId or projectId is required" },
        { status: 400 }
      );
    }

    const where: any = {};

    if (taskId) {
      where.taskId = taskId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (parentCommentId) {
      where.parentCommentId = parentCommentId;
    } else if (!includeReplies) {
      // Only show top-level comments unless explicitly requesting replies
      where.parentCommentId = null;
    }

    const include: any = {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          department: true,
          departmentName: true,
        },
      },
    };

    if (includeReplies) {
      include.replies = {
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
        orderBy: { createdAt: "asc" },
      };
    }

    const comments = await prisma.comment.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, taskId, projectId, parentCommentId, mentions = [] } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    if (!taskId && !projectId) {
      return NextResponse.json(
        { error: "Either taskId or projectId is required" },
        { status: 400 }
      );
    }

    // Validate task exists if provided
    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });
      if (!task) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }
    }

    // Validate project exists if provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
    }

    // Validate parent comment exists if provided
    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId },
      });
      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    // Validate mentioned users exist
    if (mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { id: { in: mentions } },
        select: { id: true },
      });
      const validMentionIds = mentionedUsers.map(user => user.id);
      const invalidMentions = mentions.filter((id: string) => !validMentionIds.includes(id));
      
      if (invalidMentions.length > 0) {
        return NextResponse.json(
          { error: `Invalid user mentions: ${invalidMentions.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        taskId,
        projectId,
        parentCommentId,
        mentions,
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
        replies: {
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
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
} 