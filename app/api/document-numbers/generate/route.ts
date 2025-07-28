import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// POST /api/document-numbers/generate - Generate a new document number
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      templateId,
      projectId,
      year = new Date().getFullYear(),
    } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Get the template
    const template = await prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Document template not found" },
        { status: 404 }
      );
    }

    if (!template.isActive) {
      return NextResponse.json(
        { error: "Document template is not active" },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Increment the sequence number
      const updatedTemplate = await tx.documentTemplate.update({
        where: { id: templateId },
        data: {
          currentSequence: {
            increment: 1,
          },
        },
      });

      // Generate the document number
      const sequenceNumber = updatedTemplate.currentSequence;
      const documentNumber = `${template.prefix}-${year}-${sequenceNumber.toString().padStart(3, '0')}`;

      // Create the document number record
      const documentNumberRecord = await tx.documentNumber.create({
        data: {
          documentNumber,
          templateId,
          projectId,
          sequenceNumber,
          year,
          createdById: session.user.id,
        },
        include: {
          template: {
            select: {
              id: true,
              templateName: true,
              templateCode: true,
            },
          },
          project: projectId ? {
            select: {
              id: true,
              name: true,
            },
          } : undefined,
        },
      });

      return {
        documentNumber: documentNumberRecord,
        template: updatedTemplate,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error generating document number:", error);
    return NextResponse.json(
      { error: "Failed to generate document number" },
      { status: 500 }
    );
  }
} 