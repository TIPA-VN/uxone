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
  const workflowState = searchParams.get('workflowState');
  
  let docs;
  if (projectId && department && workflowState) {
    docs = await prisma.$queryRawUnsafe(
      `SELECT * FROM "documents" WHERE "projectId" = '${projectId}' AND "department" = '${department}' AND "workflowState" = '${workflowState}' ORDER BY "createdAt" DESC`
    );
  } else if (projectId && workflowState) {
    docs = await prisma.$queryRawUnsafe(
      `SELECT * FROM "documents" WHERE "projectId" = '${projectId}' AND "workflowState" = '${workflowState}' ORDER BY "createdAt" DESC`
    );
  } else if (projectId && department) {
    docs = await prisma.$queryRawUnsafe(
      `SELECT * FROM "documents" WHERE "projectId" = '${projectId}' AND "department" = '${department}' ORDER BY "createdAt" DESC`
    );
  } else if (projectId) {
    docs = await prisma.$queryRawUnsafe(
      `SELECT * FROM "documents" WHERE "projectId" = '${projectId}' ORDER BY "createdAt" DESC`
    );
  } else {
    docs = await prisma.$queryRawUnsafe(
      `SELECT * FROM "documents" ORDER BY "createdAt" DESC LIMIT 50`
    );
  }
  
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
  // Parse type from metadata
  let docType = "";
  try {
    if (metadata) {
      const metaObj = JSON.parse(metadata as string);
      docType = metaObj.type || "";
    }
  } catch {}
  // Versioning: find max version for same fileName, type, project, department
  let version = 1;
  if (file.name && docType && projectId && department) {
    const existing = await prisma.$queryRawUnsafe<{ max_version: number }[]>(
      `SELECT MAX("version") as max_version FROM "documents" WHERE "fileName" = '${file.name.replace(/'/g, "''")}' AND (metadata->>'type') = '${docType.replace(/'/g, "''")}' AND "projectId" = '${projectId}' AND "department" = '${department}'`
    );
    if (Array.isArray(existing) && existing.length > 0 && existing[0].max_version) {
      version = Number(existing[0].max_version) + 1;
    }
  }
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
        ${version},
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
  
  return NextResponse.json({ id: doc });
} 