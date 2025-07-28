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

    if (!taskId && !projectId) {
      return NextResponse.json(
        { error: "Either taskId or projectId is required" },
        { status: 400 }
      );
    }

    const include = {
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

    // Use ProjectComment for project comments, Comment for task comments
    let comments;
    if (projectId) {
      comments = await prisma.projectComment.findMany({
        where: { projectId },
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
        orderBy: { createdAt: "desc" },
      });
    } else {
      const where = { taskId };
      comments = await prisma.comment.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
      });
    }

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
    const { content, taskId, projectId: rawProjectId } = body;
    
    // Ensure projectId is a string, not an array
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

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



    // Use ProjectComment for project comments, Comment for task comments
    let comment;
    if (projectId) {
      comment = await prisma.projectComment.create({
        data: {
          content: content.trim(),
          authorId: session.user.id,
          projectId,
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
    } else {
      comment = await prisma.comment.create({
        data: {
          content: content.trim(),
          authorId: session.user.id,
          taskId,
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
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
} 