import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { readFile, stat } from "fs/promises";
import path from "path";

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId, attachmentId } = await params;

    // Verify task access
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { ownerId: session.user.id },
          { assigneeId: session.user.id },
          { creatorId: session.user.id },
        ],
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }

    // Get attachment details
    const attachment = await prisma.taskAttachment.findFirst({
      where: { 
        id: attachmentId,
        taskId: taskId
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Construct the full file path
    const uploadDir = path.join(process.cwd(), "public", "uploads", "tasks");
    const fileName = path.basename(attachment.filePath);
    const fullFilePath = path.join(uploadDir, fileName);

    try {
      // Check if file exists
      const fileStats = await stat(fullFilePath);
      if (!fileStats.isFile()) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      // Read the file
      const fileBuffer = await readFile(fullFilePath);

      // Set appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', attachment.fileType || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
      headers.set('Content-Length', fileStats.size.toString());

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
    } catch (fileError) {
      console.error('Error reading file:', fileError);
      return NextResponse.json({ error: "File not found or cannot be read" }, { status: 404 });
    }
  } catch (error) {
    console.error('Error downloading task attachment:', error);
    return NextResponse.json({ error: 'Failed to download attachment' }, { status: 500 });
  }
}
