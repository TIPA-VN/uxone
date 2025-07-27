import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/search - Unified search across tasks and projects
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type"); // "tasks", "projects", or "all"
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const ownerId = searchParams.get("ownerId");
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const results: any = {
      tasks: [],
      projects: [],
      total: 0,
    };

    // Search tasks
    if (!type || type === "tasks" || type === "all") {
      const taskWhere: any = {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          {
            OR: [
              { ownerId: session.user.id },
              { assigneeId: session.user.id },
              { creatorId: session.user.id },
            ],
          },
        ],
      };

      if (status) taskWhere.status = status;
      if (priority) taskWhere.priority = priority;
      if (assigneeId) taskWhere.assigneeId = assigneeId;
      if (ownerId) taskWhere.ownerId = ownerId;
      if (projectId) taskWhere.projectId = projectId;

      const tasks = await prisma.task.findMany({
        where: taskWhere,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
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
          { createdAt: "desc" },
        ],
        take: limit,
        skip: offset,
      });

      results.tasks = tasks;
    }

    // Search projects
    if (!type || type === "projects" || type === "all") {
      const projectWhere: any = {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          {
            OR: [
              { ownerId: session.user.id },
              { members: { some: { userId: session.user.id } } },
              { departments: { has: session.user.department } },
            ],
          },
        ],
      };

      if (status) projectWhere.status = status;
      if (ownerId) projectWhere.ownerId = ownerId;

      const projects = await prisma.project.findMany({
        where: projectWhere,
        include: {
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
              tasks: true,
              documents: true,
              comments: true,
              members: true,
            },
          },
        },
        orderBy: [
          { status: "asc" },
          { startDate: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
        skip: offset,
      });

      results.projects = projects;
    }

    // Calculate totals
    const taskCount = await prisma.task.count({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          {
            OR: [
              { ownerId: session.user.id },
              { assigneeId: session.user.id },
              { creatorId: session.user.id },
            ],
          },
        ],
      },
    });

    const projectCount = await prisma.project.count({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          {
            OR: [
              { ownerId: session.user.id },
              { members: { some: { userId: session.user.id } } },
              { departments: { has: session.user.department } },
            ],
          },
        ],
      },
    });

    results.total = taskCount + projectCount;

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
} 