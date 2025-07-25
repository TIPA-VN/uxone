import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import util from 'util';

// Force Node.js runtime for Prisma
export const runtime = 'nodejs'

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "projects");

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const department = searchParams.get('department');
  console.log("[GET /api/documents] projectId:", projectId, "department:", department);
  let docs;
  if (projectId && department) {
    docs = await prisma.$queryRawUnsafe(
      `SELECT * FROM "documents" WHERE "projectId" = '${projectId}' AND "department" = '${department}' ORDER BY "createdAt" DESC LIMIT 50`
    );
  } else if (projectId) {
    docs = await prisma.$queryRawUnsafe(
      `SELECT * FROM "documents" WHERE "projectId" = '${projectId}' ORDER BY "createdAt" DESC LIMIT 50`
    );
  } else {
    docs = await prisma.$queryRawUnsafe(
      `SELECT * FROM "documents" ORDER BY "createdAt" DESC LIMIT 50`
    );
  }
  console.log("[GET /api/documents] DB result:", util.inspect(docs, { depth: 3 }));
  return NextResponse.json(docs);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Parse multipart form
  const formData = await request.formData();
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
  const projectId = formData.get("projectId");
  // Save to DB using raw query
  const doc = await prisma.$queryRawUnsafe(
    `
      INSERT INTO "documents" (
        "id", 
        "fileName", 
        "filePath", 
        "fileType", 
        "size", 
        "version", 
        "metadata", 
        "ownerId", 
        "department", 
        "accessRoles", 
        "projectId",
        "createdAt", 
        "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        '${file.name}',
        '${`/uploads/projects/${fileName}`}',
        '${file.type}',
        ${file.size},
        1,
        '${metadata ? JSON.stringify(JSON.parse(metadata as string)) : '{}'}'::jsonb,
        '${session.user.id}',
        '${department}',
        ARRAY[${accessRoles.map((r: string) => `'${r}'`).join(', ')}]::text[],
        '${projectId}',
        NOW(),
        NOW()
      )
      RETURNING *
    `
  );
  console.log("[POST /api/documents] Inserted doc:", util.inspect(doc, { depth: 3 }));
  return NextResponse.json({ id: doc });
} 