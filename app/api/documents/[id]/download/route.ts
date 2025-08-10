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

    // Check document access
    const accessResult = checkDocumentAccess(document, session.user);
    if (!accessResult.canAccess) {
      return NextResponse.json({ 
        error: accessResult.reason || "Not authorized to download this document" 
      }, { status: 403 });
    }

    // Construct file path - the filePath in DB is relative to public folder
    // e.g., "/uploads/projects/filename" -> should map to "public/uploads/projects/filename"
    let filePath;
    if (document.filePath.startsWith('/')) {
      // Remove leading slash and join with public directory
      filePath = path.join(process.cwd(), "public", document.filePath.substring(1));
    } else {
      // Direct path join
      filePath = path.join(process.cwd(), "public", document.filePath);
    }
    

    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      // Try alternative path construction
      const altPath = path.join(process.cwd(), document.filePath);
      
      try {
        await fs.access(altPath);
        filePath = altPath; // Use alternative path if it works
      } catch (altError) {
        return NextResponse.json({ 
          error: "File not found on disk"
        }, { status: 404 });
      }
    }

    // Read file
    let fileBuffer;
    try {
      fileBuffer = await fs.readFile(filePath);
    } catch (error) {
      return NextResponse.json({ 
        error: "Failed to read file from disk"
      }, { status: 500 });
    }
    
    // Determine content type based on file extension
    const ext = path.extname(document.fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    
    // Binary file types
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.bmp') contentType = 'image/bmp';
    else if (ext === '.tiff' || ext === '.tif') contentType = 'image/tiff';
    
    // Text file types
    else if (ext === '.txt') contentType = 'text/plain; charset=utf-8';
    else if (ext === '.json') contentType = 'application/json; charset=utf-8';
    else if (ext === '.xml') contentType = 'application/xml; charset=utf-8';
    else if (ext === '.csv') contentType = 'text/csv; charset=utf-8';
    else if (ext === '.md') contentType = 'text/markdown; charset=utf-8';
    else if (ext === '.log') contentType = 'text/plain; charset=utf-8';
    
    // Office document types
    else if (ext === '.doc') contentType = 'application/msword';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.xls') contentType = 'application/vnd.ms-excel';
    else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === '.ppt') contentType = 'application/vnd.ms-powerpoint';
    else if (ext === '.pptx') contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';



    // Return file with download headers
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

    return response;

  } catch (error) {
    console.error("Document download error:", error);
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
} 