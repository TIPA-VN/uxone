import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import * as fs from "fs/promises";
import * as path from "path";
import { PDFDocument } from "pdf-lib";

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

    // Get all source documents
    const pages = await prisma.document.findMany({
      where: {
        id: { in: pageIds },
        projectId: projectIdStr,
        department,
      },
    });

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
        fileType: "pdf",
        size: pdfBytes.length,
        metadata: {
          type: "combined_pdf",
          description: `Combined PDF from ${pages.length} pages`,
        },
        ownerId: session.user.id,
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