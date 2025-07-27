import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendNotification } from "@/app/api/notifications/stream/route";

// GET - Fetch comments for a project
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const comments = await prisma.projectComment.findMany({
      where: {
        projectId: projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { text, type, author, projectId } = body;

    if (!text || !type || !author || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure projectId is a string (handle array case from dynamic routes)
    const projectIdStr = Array.isArray(projectId) ? projectId[0] : String(projectId);

    // Validate comment type
    if (!["comment", "update"].includes(type)) {
      return NextResponse.json({ error: "Invalid comment type" }, { status: 400 });
    }

    const comment = await prisma.projectComment.create({
      data: {
        content: text,
        authorId: session.user.id,
        projectId: projectIdStr,
      },
    });

    // Send notifications to all department heads
    try {
      // Get the project to find department heads
      const project = await prisma.project.findUnique({
        where: { id: projectIdStr },
        include: { owner: true }
      });

      if (project) {
        // Find all users who are senior managers or admins in the project's departments
        const departmentHeads = await prisma.user.findMany({
          where: {
            OR: [
              { role: "SENIOR MANAGER" },
              { role: "ADMIN" }
            ]
          }
        });

        // Filter by project departments (case-insensitive)
        const projectDepartmentsLower = project.departments.map(dept => dept.toLowerCase());
        const filteredHeads = departmentHeads.filter(head => {
          const headDeptLower = head.department?.toLowerCase();
          const isInProject = headDeptLower && projectDepartmentsLower.includes(headDeptLower);
          return isInProject;
        });

        // Create notifications for each department head
        for (const head of filteredHeads) {
          // Don't notify the comment author
          if (head.id === session.user.id) {
            continue;
          }

          const notification = await prisma.notification.create({
            data: {
              userId: head.id,
              title: `New ${type === 'comment' ? 'Comment' : 'Update'} on Project "${project.name}"`,
              message: `${session.user.name || session.user.username} added a ${type}: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`,
              type: type === 'comment' ? 'info' : 'warning',
              link: `/lvm/projects/${projectIdStr}`,
            },
          });

          // Send real-time notification
          sendNotification(notification, head.id);
        }

        // Send notification to project owner
        try {
          const notification = await prisma.notification.create({
            data: {
              userId: project.ownerId,
              title: `New Comment on ${project.name}`,
              message: `A new comment was added to project "${project.name}" by ${session.user.name || session.user.username}`,
              type: "info",
              link: `/lvm/projects/${projectIdStr}`,
            },
          });
          
          // Send real-time notification
          sendNotification(notification, project.ownerId);
        } catch (error) {
          console.error("Error creating comment notification:", error);
          // Don't fail the comment creation if notification fails
        }
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      // Don't fail the comment creation if notifications fail
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 