import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// POST /api/document-templates/bulk - Create multiple templates from CSV data
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { templates } = body;

    if (!templates || !Array.isArray(templates) || templates.length === 0) {
      return NextResponse.json({ error: "Templates array is required" }, { status: 400 });
    }

    // Validate each template
    const validationErrors: string[] = [];
    templates.forEach((template: any, index: number) => {
      if (!template.templateName) {
        validationErrors.push(`Template ${index + 1}: templateName is required`);
      }
      if (!template.templateCode) {
        validationErrors.push(`Template ${index + 1}: templateCode is required`);
      }
      if (!template.prefix) {
        validationErrors.push(`Template ${index + 1}: prefix is required`);
      }
      if (!template.revisionNumber || isNaN(Number(template.revisionNumber))) {
        validationErrors.push(`Template ${index + 1}: revisionNumber must be a valid number`);
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationErrors 
      }, { status: 400 });
    }

    // Check for duplicate template codes
    const templateCodes = templates.map((t: { templateCode: string }) => t.templateCode);
    const existingTemplates = await prisma.documentTemplate.findMany({
      where: { templateCode: { in: templateCodes } },
      select: { templateCode: true }
    });

    if (existingTemplates.length > 0) {
      const existingCodes = existingTemplates.map((t: { templateCode: string }) => t.templateCode);
      return NextResponse.json({ 
        error: "Duplicate template codes found", 
        details: `Template codes already exist: ${existingCodes.join(', ')}` 
      }, { status: 400 });
    }

    // Create templates in a transaction
    const createdTemplates = await prisma.$transaction(async (tx: any) => {
      const results = [];
      
      for (const templateData of templates) {
        const template = await tx.documentTemplate.create({
          data: {
            templateName: templateData.templateName,
            templateCode: templateData.templateCode,
            description: templateData.description || '',
            prefix: templateData.prefix,
            year: new Date().getFullYear(), // Auto-set to current year
            revisionNumber: Number(templateData.revisionNumber),
            effectiveDate: new Date(),
            currentSequence: 0,
            isActive: true,
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
        
        results.push(template);
      }
      
      return results;
    });

    return NextResponse.json({
      message: `Successfully created ${createdTemplates.length} templates`,
      templates: createdTemplates,
      count: createdTemplates.length,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating bulk templates:", error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "Duplicate template code found" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to create templates" },
      { status: 500 }
    );
  }
} 