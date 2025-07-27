import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import * as fs from "fs/promises";
import * as path from "path";

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
    if (!id) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    // Fetch document with project info
    const document = await prisma.document.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if user is project owner
    if (document.project?.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only project owner can delete documents" }, { status: 403 });
    }

    // Check if document is in production (read-only)
    if (document.workflowState === "production") {
      return NextResponse.json({ error: "Cannot delete production documents" }, { status: 400 });
    }

    // Delete the file from disk
    try {
      const filePath = path.join(process.cwd(), "public", document.filePath);
      await fs.unlink(filePath);
    } catch (error) {
      console.error("Failed to delete file from disk:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete the document from database
    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Document deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
} 