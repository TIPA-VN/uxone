import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 401 });
    }

    const { id } = await params;

    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Error fetching task attachments:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { fileName, filePath, fileType, size } = body;

    if (!fileName || !filePath || !fileType || !size) {
      return NextResponse.json({ error: "All file information is required" }, { status: 400 });
    }

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

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: id,
        fileName,
        filePath,
        fileType,
        fileSize: parseInt(size),
        uploadedById: session.user.id,
      }
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.error('Error creating task attachment:', error);
    return NextResponse.json({ error: 'Failed to create attachment' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID is required" }, { status: 400 });
    }

    // Verify attachment ownership or task access
    const attachment = await prisma.taskAttachment.findFirst({
      where: { 
        id: attachmentId,
        taskId: id
      },
      include: {
        task: true
      }
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Check if user can delete (owner, assignee, or creator)
    const canDelete = 
      attachment.task.ownerId === session.user.id ||
      attachment.task.assigneeId === session.user.id ||
      attachment.task.creatorId === session.user.id;

    if (!canDelete) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.taskAttachment.delete({
      where: { id: attachmentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task attachment:', error);
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
} 