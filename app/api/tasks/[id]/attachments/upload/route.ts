import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { 
  getCustomUploadDir, 
  generateUniqueFilename, 
  isValidFileType, 
  isValidFileSize,
  ensureUploadDirectory 
} from "@/lib/file-utils";

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify task access
    const task = await prisma.task.findFirst({
      where: {
        id,
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

    // Parse multipart form
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type and size
    if (!isValidFileType(file.name)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    
    if (!isValidFileSize(file.size)) {
      return NextResponse.json({ error: 'File size exceeds limit' }, { status: 400 });
    }

    // Create upload directory (custom or public)
    const uploadDir = await ensureUploadDirectory('tasks');
    
    // Generate unique filename
    const fileName = generateUniqueFilename(file.name, 'tasks');
    const filePath = path.join(uploadDir, fileName);

    // Save file
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(arrayBuffer));

    // Create attachment record
    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: id,
        fileName: file.name,
        filePath: `/uploads/tasks/${fileName}`,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        uploadedById: session.user.id,
      }
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.error('Error uploading task attachment:', error);
    return NextResponse.json({ error: 'Failed to upload attachment' }, { status: 500 });
  }
} 