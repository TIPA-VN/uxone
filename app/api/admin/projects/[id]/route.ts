import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and has admin access
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAdminRole = ['ADMIN', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'SENIOR_MANAGER'].includes(session.user.role || '');
    const isISDepartment = session.user.department === 'IS';
    
    if (!hasAdminRole && !isISDepartment) {
      return NextResponse.json({ error: "Access denied. Admin privileges or IS department access required." }, { status: 403 });
    }

    const projectId = params.id;

    // Use a transaction to ensure all deletions happen atomically
    const result = await prisma.$transaction(async (tx) => {
      // First, verify the project exists
      const project = await tx.project.findUnique({
        where: { id: projectId },
        include: {
          _count: {
            select: {
              tasks: true,
              documents: true,
              comments: true,
              members: true,
              documentNumbers: true,
            },
          },
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      // Delete in the correct order to respect foreign key constraints
      
      // 1. Delete task dependencies first (if they exist)
      await tx.taskDependency.deleteMany({
        where: {
          OR: [
            { dependentTaskId: { in: (await tx.task.findMany({ where: { projectId }, select: { id: true } })).map(t => t.id) } },
            { dependencyTaskId: { in: (await tx.task.findMany({ where: { projectId }, select: { id: true } })).map(t => t.id) } }
          ]
        }
      });

      // 2. Delete task attachments
      await tx.taskAttachment.deleteMany({
        where: {
          taskId: { in: (await tx.task.findMany({ where: { projectId }, select: { id: true } })).map(t => t.id) }
        }
      });

      // 3. Delete task comments
      await tx.taskComment.deleteMany({
        where: {
          taskId: { in: (await tx.task.findMany({ where: { projectId }, select: { id: true } })).map(t => t.id) }
        }
      });

      // 4. Delete tasks
      await tx.task.deleteMany({
        where: { projectId }
      });

      // 5. Delete project comments
      await tx.projectComment.deleteMany({
        where: { projectId }
      });

      // 6. Delete project members
      await tx.projectMember.deleteMany({
        where: { projectId }
      });

      // 7. Delete project notes
      await tx.note.deleteMany({
        where: { projectId }
      });

      // 8. Delete project documents
      await tx.document.deleteMany({
        where: { projectId }
      });

      // 9. Delete document numbers associated with this project
      await tx.documentNumber.deleteMany({
        where: { projectId }
      });

      // 10. Finally, delete the project itself
      const deletedProject = await tx.project.delete({
        where: { id: projectId }
      });

      return {
        deletedProject,
        deletedCounts: project._count
      };
    });

    return NextResponse.json({
      message: "Project and all related data deleted successfully",
      deletedProject: result.deletedProject,
      deletedCounts: result.deletedCounts
    });

  } catch (error) {
    console.error("Error deleting project:", error);
    
    if (error instanceof Error && error.message === "Project not found") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
