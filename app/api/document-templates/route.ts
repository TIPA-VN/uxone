import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// GET /api/document-templates - Get all document templates
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const year = searchParams.get("year");

    const where: any = {};

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (year) {
      where.year = parseInt(year);
    }

    const templates = await prisma.documentTemplate.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        _count: {
          select: {
            generatedDocuments: true,
          },
        },
      },
      orderBy: [
        { isActive: "desc" },
        { templateName: "asc" },
      ],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching document templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch document templates" },
      { status: 500 }
    );
  }
}

// POST /api/document-templates - Create a new document template
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      templateName,
      templateCode,
      description,
      prefix,
      effectiveDate,
      revisionNumber = 1,
    } = body;

    if (!templateName || !templateCode || !prefix) {
      return NextResponse.json(
        { error: "Template name, code, and prefix are required" },
        { status: 400 }
      );
    }

    // Check if template code already exists
    const existingTemplate = await prisma.documentTemplate.findUnique({
      where: { templateCode },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: "Template code already exists" },
        { status: 400 }
      );
    }

    const template = await prisma.documentTemplate.create({
      data: {
        templateName,
        templateCode,
        description,
        prefix,
        year: new Date().getFullYear(), // Auto-set to current year
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        revisionNumber,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating document template:", error);
    return NextResponse.json(
      { error: "Failed to create document template" },
      { status: 500 }
    );
  }
}

// PATCH /api/document-templates - Update document template
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Document template not found" },
        { status: 404 }
      );
    }

    // If updating template code, check for uniqueness
    if (updates.templateCode && updates.templateCode !== existingTemplate.templateCode) {
      const duplicateTemplate = await prisma.documentTemplate.findUnique({
        where: { templateCode: updates.templateCode },
      });

      if (duplicateTemplate) {
        return NextResponse.json(
          { error: "Template code already exists" },
          { status: 400 }
        );
      }
    }

    const updatedTemplate = await prisma.documentTemplate.update({
      where: { id },
      data: {
        ...updates,
        effectiveDate: updates.effectiveDate ? new Date(updates.effectiveDate) : undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating document template:", error);
    return NextResponse.json(
      { error: "Failed to update document template" },
      { status: 500 }
    );
  }
}

// DELETE /api/document-templates - Delete document template
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin or QC permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isQC = session.user.department?.toLowerCase() === 'qc';
    
    if (!isAdmin && !isQC) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Check if template exists and has no generated documents
    const template = await prisma.documentTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            generatedDocuments: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Document template not found" },
        { status: 404 }
      );
    }

    if (template._count.generatedDocuments > 0) {
      return NextResponse.json(
        { error: "Cannot delete template with existing generated documents" },
        { status: 400 }
      );
    }

    await prisma.documentTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Document template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document template:", error);
    return NextResponse.json(
      { error: "Failed to delete document template" },
      { status: 500 }
    );
  }
} 