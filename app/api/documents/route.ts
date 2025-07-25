import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // List all documents (MVP: all, later: filter by access)
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Parse multipart form
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  const fileName = `${Date.now()}_${file.name}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, fileName);
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(arrayBuffer));
  // Metadata
  const metadata = formData.get("metadata");
  const department = formData.get("department") as string | null;
  const accessRoles = formData.getAll("accessRoles").map(String);
  // Save to DB
  const doc = await prisma.document.create({
    data: {
      fileName: file.name,
      filePath: `/uploads/${fileName}`,
      fileType: file.type,
      size: file.size,
      version: 1,
      metadata: metadata ? JSON.parse(metadata as string) : {},
      ownerId: session.user.id,
      department,
      accessRoles,
    },
  });
  return NextResponse.json(doc);
} 