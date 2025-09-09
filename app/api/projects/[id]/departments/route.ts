import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrismaAudit } from "@/lib/prisma-audit";

// GET /api/projects/[id]/departments - Get project departments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        departments: true,
        ownerId: true,
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access to this project
    const hasAccess = 
      project.ownerId === session.user.id ||
      project.members.some(member => member.userId === session.user.id) ||
      project.departments.includes(session.user.department || "");

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      departments: project.departments,
      projectName: project.name
    });
  } catch (error) {
    console.error("Error fetching project departments:", error);
    return NextResponse.json(
      { error: "Failed to fetch project departments" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id]/departments - Update project departments
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { departments, action } = await request.json();

    if (!Array.isArray(departments)) {
      return NextResponse.json({ 
        error: "Invalid request", 
        message: "Departments must be an array" 
      }, { status: 400 });
    }

    if (!action || !['add', 'remove', 'replace'].includes(action)) {
      return NextResponse.json({ 
        error: "Invalid request", 
        message: "Action must be 'add', 'remove', or 'replace'" 
      }, { status: 400 });
    }

    // Check if project exists and user has access
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        departments: true,
        ownerId: true,
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has permission to update this project
    const isProjectOwner = existingProject.ownerId === session.user.id;
    const isManager = session.user.role && [
      'ADMIN', 'GENERAL_DIRECTOR', 'GENERAL MANAGER', 'GENERAL_MANAGER',
      'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT GENERAL MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'ASSISTANT GENERAL MANAGER 2',
      'SENIOR_MANAGER', 'SENIOR MANAGER', 'SENIOR_MANAGER_2', 'SENIOR MANAGER 2', 'ASSISTANT_SENIOR_MANAGER', 'ASSISTANT SENIOR MANAGER',
      'MANAGER', 'MANAGER_2', 'MANAGER 2', 'ASSISTANT_MANAGER', 'ASSISTANT MANAGER', 'ASSISTANT_MANAGER_2', 'ASSISTANT MANAGER 2'
    ].includes(session.user.role.toUpperCase());

    if (!isProjectOwner && !isManager) {
      return NextResponse.json({ 
        error: "Access denied", 
        message: "Only project owners and managers can modify departments" 
      }, { status: 403 });
    }

    let updatedDepartments = [...existingProject.departments];

    switch (action) {
      case 'add':
        // Add new departments (avoid duplicates)
        departments.forEach((dept: string) => {
          if (!updatedDepartments.includes(dept)) {
            updatedDepartments.push(dept);
          }
        });
        break;
      
      case 'remove':
        // Departments cannot be removed once added
        return NextResponse.json({ 
          error: "Operation not allowed", 
          message: "Departments cannot be removed once added to the project" 
        }, { status: 400 });
      
      case 'replace':
        // Only allow adding new departments, not removing existing ones
        const newDepartments = departments.filter(dept => !existingProject.departments.includes(dept));
        updatedDepartments = [...existingProject.departments, ...newDepartments];
        break;
    }

    // Update the project with new departments
    const updatedProject = await PrismaAudit.updateAuditFields(
      prisma,
      prisma.project,
      projectId,
      { departments: updatedDepartments }
    );

    return NextResponse.json({
      success: true,
      message: `Departments ${action}ed successfully`,
      departments: updatedDepartments,
      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        departments: updatedProject.departments
      }
    });
  } catch (error) {
    console.error("Error updating project departments:", error);
    return NextResponse.json(
      { error: "Failed to update project departments" },
      { status: 500 }
    );
  }
}
