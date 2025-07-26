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
        timestamp: "desc",
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
        text,
        type,
        authorId: session.user.id,
        author,
        project: {
          connect: {
            id: projectIdStr
          }
        },
        timestamp: new Date(),
      },
    });

    // Send notifications to all department heads
    try {
      console.log("Starting notification process for projectId:", projectIdStr);
      
      // Get the project to find department heads
      const project = await prisma.project.findUnique({
        where: { id: projectIdStr },
        include: { owner: true }
      });

      console.log("Project found:", project?.name, "Departments:", project?.departments);

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

        console.log("All senior managers and admins:", departmentHeads.map(h => ({ id: h.id, name: h.name, role: h.role, department: h.department })));

        // Filter by project departments (case-insensitive)
        const projectDepartmentsLower = project.departments.map(dept => dept.toLowerCase());
        const filteredHeads = departmentHeads.filter(head => {
          const headDeptLower = head.department?.toLowerCase();
          const isInProject = headDeptLower && projectDepartmentsLower.includes(headDeptLower);
          console.log(`Checking ${head.name} (${head.department}) against project departments:`, projectDepartmentsLower, "Result:", isInProject);
          return isInProject;
        });

        console.log("Filtered department heads:", filteredHeads.length, "Heads:", filteredHeads.map(h => ({ id: h.id, name: h.name, role: h.role, department: h.department })));

        console.log("Department heads found:", filteredHeads.length, "Heads:", filteredHeads.map(h => ({ id: h.id, name: h.name, role: h.role, department: h.department })));

        // Create notifications for each department head
        for (const head of filteredHeads) {
          // Don't notify the comment author
          if (head.id === session.user.id) {
            console.log("Skipping notification for comment author:", head.name);
            continue;
          }

          console.log("Creating notification for:", head.name, "Role:", head.role, "Department:", head.department);

          const notification = await prisma.notification.create({
            data: {
              userId: head.id,
              title: `New ${type === 'comment' ? 'Comment' : 'Update'} on Project "${project.name}"`,
              message: `${session.user.name || session.user.username} added a ${type}: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`,
              type: type === 'comment' ? 'info' : 'warning',
              link: `/lvm/projects/${projectIdStr}`,
            },
          });

          console.log("Notification created:", notification.id);

          // Send real-time notification
          sendNotification(notification, head.id);
          console.log("Real-time notification sent to:", head.id);
        }

        // Also send a test notification to the project owner
        if (project.ownerId !== session.user.id) {
          console.log("Sending test notification to project owner:", project.ownerId);
          const ownerNotification = await prisma.notification.create({
            data: {
              userId: project.ownerId,
              title: `New ${type === 'comment' ? 'Comment' : 'Update'} on Your Project "${project.name}"`,
              message: `${session.user.name || session.user.username} added a ${type}: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`,
              type: type === 'comment' ? 'info' : 'warning',
              link: `/lvm/projects/${projectIdStr}`,
            },
          });
          sendNotification(ownerNotification, project.ownerId);
          console.log("Owner notification sent");
        }
      } else {
        console.log("Project not found for ID:", projectIdStr);
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