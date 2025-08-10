import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
// PDF-LIB will be imported when the library is installed
// import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const department = formData.get('department') as string;
    const metadata = formData.get('metadata') as string;

    if (!file || !projectId || !department) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
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

    // Check if file is a PDF
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    // Parse metadata
    let docType = "";
    try {
      if (metadata) {
        const metaObj = JSON.parse(metadata as string);
        docType = metaObj.type || "";
      }
    } catch {}

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId, 'pages');
    await mkdir(uploadDir, { recursive: true });

    // Check if PDF-LIB is available and split PDF
    let pdfDoc: any;
    let pageCount: number;
    
    try {
      const { PDFDocument } = await import("pdf-lib");
      
      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      pdfDoc = await PDFDocument.load(arrayBuffer);
      pageCount = pdfDoc.getPageCount();

      if (pageCount === 0) {
        return NextResponse.json({ error: "PDF has no pages" }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: "PDF-LIB library not installed. Please run 'npm install pdf-lib' to enable PDF splitting functionality." 
      }, { status: 500 });
    }

    const pages = [];
    const baseFileName = file.name.replace('.pdf', '');

    // Split PDF into individual pages
    try {
      const { PDFDocument } = await import("pdf-lib");
      
      for (let i = 0; i < pageCount; i++) {
        const newPdfDoc = await PDFDocument.create();
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);

        const pdfBytes = await newPdfDoc.save();
        const pageFileName = `${baseFileName}_page_${i + 1}.pdf`;
        const pageFilePath = join(uploadDir, pageFileName);
        const relativePath = `/uploads/projects/${projectId}/pages/${pageFileName}`;

        // Save the page file
        await writeFile(pageFilePath, pdfBytes);

        // Versioning: find max version for same fileName, type, project, department
        let version = 1;
        if (pageFileName && docType && projectId && department) {
          const existing = await prisma.$queryRawUnsafe<{ max_version: number }[]>(
            `SELECT MAX("version") as max_version FROM "documents" WHERE "fileName" = '${pageFileName.replace(/'/g, "''")}' AND (metadata->>'type') = '${docType.replace(/'/g, "''")}' AND "projectId" = '${projectId}' AND "department" = '${department}'`
          );
          if (Array.isArray(existing) && existing.length > 0 && existing[0].max_version) {
            version = Number(existing[0].max_version) + 1;
          }
        }

        // Save page document to database
        const pageDoc = await prisma.document.create({
          data: {
            fileName: pageFileName,
            filePath: relativePath,
            fileType: "application/pdf",
            size: pdfBytes.length,
            version,
            metadata: {
              type: docType,
              pageNumber: i + 1,
              originalFile: file.name,
              splitFrom: true
            },
            ownerId: session.user.id,
            department,
            projectId,
            accessRoles: ["ADMIN", "SENIOR MANAGER", "MANAGER"]
          }
        });

        pages.push(pageDoc);
      }

      return NextResponse.json({ 
        success: true, 
        message: `PDF split into ${pageCount} pages`,
        pages: pages.map(page => ({
          id: page.id,
          fileName: page.fileName,
          filePath: page.filePath
        }))
      });

    } catch (error) {
      console.error('Error splitting PDF:', error);
      return NextResponse.json({ 
        error: "Failed to split PDF" 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in split-pdf route:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 