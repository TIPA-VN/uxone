import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import * as fs from "fs/promises";
import * as path from "path";
import { PDFDocument } from "pdf-lib";
import { checkDocumentAccess } from "@/lib/documentAccess";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageIds, projectId, department } = await req.json();

    if (!pageIds?.length || !projectId || !department) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure projectId is a string
    const projectIdStr = Array.isArray(projectId) ? projectId[0] : String(projectId);

    // Check if user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectIdStr },
      select: { 
        id: true, 
        ownerId: true, 
        departments: true,
        members: { select: { userId: true } }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check project access
    const hasProjectAccess = 
      project.ownerId === session.user.id ||
      project.members.some(member => member.userId === session.user.id) ||
      project.departments.includes(session.user.department || "");

    if (!hasProjectAccess) {
      return NextResponse.json({ error: "Access denied to this project" }, { status: 403 });
    }

    // Get all source documents with project info for access control
    const pages = await prisma.document.findMany({
      where: {
        id: { in: pageIds },
        projectId: projectIdStr,
        department,
      },
      include: { project: true }
    });

    if (pages.length === 0) {
      return NextResponse.json({ error: "No valid pages found" }, { status: 404 });
    }

    // Check access to each document
    for (const page of pages) {
      const accessResult = checkDocumentAccess(page, session.user);
      if (!accessResult.canAccess) {
        return NextResponse.json({ 
          error: `Access denied to document ${page.fileName}: ${accessResult.reason}` 
        }, { status: 403 });
      }

      // Prevent combining production documents
      if (page.workflowState === "production") {
        return NextResponse.json({ 
          error: `Cannot combine production document ${page.fileName}` 
        }, { status: 400 });
      }
    }

    // Sort pages by pageNumber if available
    pages.sort((a, b) => {
      const aNum = (a.metadata as any)?.pageNumber || 0;
      const bNum = (b.metadata as any)?.pageNumber || 0;
      return aNum - bNum;
    });

    // Create a new PDF document
    const combinedPdf = await PDFDocument.create();

    // Add each page to the combined PDF
    for (const page of pages) {
      const sourcePdfBytes = await fs.readFile(path.join(process.cwd(), "public", page.filePath));
      const sourcePdf = await PDFDocument.load(sourcePdfBytes);
      const [firstPage] = await combinedPdf.copyPages(sourcePdf, [0]);
      combinedPdf.addPage(firstPage);
    }

    // Save the combined PDF
    const pdfBytes = await combinedPdf.save();
    const combinedFileName = `combined_${new Date().getTime()}.pdf`;
    const uploadDir = path.join(process.cwd(), "public/uploads/projects", projectIdStr);
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, combinedFileName);
    await fs.writeFile(filePath, pdfBytes);

    // Create a new document record for the combined PDF
    const combinedDoc = await prisma.document.create({
      data: {
        fileName: combinedFileName,
        filePath: `/uploads/projects/${projectIdStr}/${combinedFileName}`,
        projectId: projectIdStr,
        department,
        fileType: "application/pdf",
        size: pdfBytes.length,
        metadata: {
          type: "combined_pdf",
          description: `Combined PDF from ${pages.length} pages`,
          combinedFrom: pageIds,
          combinedAt: new Date().toISOString()
        },
        ownerId: session.user.id,
        workflowState: "draft"
      },
    });

    // Delete the source documents and their files
    for (const page of pages) {
      try {
        // Delete the file
        await fs.unlink(path.join(process.cwd(), "public", page.filePath));
      } catch (error) {
        console.error(`Failed to delete file: ${page.filePath}`, error);
      }
    }

    // Delete the source document records from the database
    await prisma.document.deleteMany({
      where: {
        id: { in: pageIds }
      }
    });

    return NextResponse.json(combinedDoc);
  } catch (error) {
    console.error("Error combining PDF pages:", error);
    return NextResponse.json(
      { error: "Failed to combine PDF pages" },
      { status: 500 }
    );
  }
} 