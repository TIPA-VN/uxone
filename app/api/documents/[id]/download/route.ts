import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkDocumentAccess } from "@/lib/documentAccess";
import * as fs from "fs/promises";
import * as path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    // Fetch document
    const document = await prisma.document.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check document access using the new access control system
    const accessResult = checkDocumentAccess(document, session.user);
    
    if (!accessResult.canAccess) {
      return NextResponse.json({ 
        error: accessResult.reason || "Not authorized to download this document" 
      }, { status: 403 });
    }

    // Construct file path
    const filePath = path.join(process.cwd(), "public", document.filePath);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);
    
    // Determine content type
    const ext = path.extname(document.fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.txt') contentType = 'text/plain';
    else if (ext === '.json') contentType = 'application/json';
    else if (ext === '.xml') contentType = 'application/xml';
    else if (ext === '.csv') contentType = 'text/csv';
    else if (ext === '.doc' || ext === '.docx') contentType = 'application/msword';
    else if (ext === '.xls' || ext === '.xlsx') contentType = 'application/vnd.ms-excel';
    else if (ext === '.ppt' || ext === '.pptx') contentType = 'application/vnd.ms-powerpoint';

    // Return file with download headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error("Document download error:", error);
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
} 