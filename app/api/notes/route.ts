import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const department = searchParams.get('department');
  if (!projectId || !department) {
    return NextResponse.json({ error: "Missing projectId or department" }, { status: 400 });
  }
  const notes = await prisma.note.findMany({
    where: { projectId, department },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { projectId, department, content } = body;
  if (!projectId || !department || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const note = await prisma.note.create({
    data: {
      projectId,
      department,
      content,
      authorId: session.user.id,
      authorName: session.user.name || session.user.username || session.user.email || 'Unknown',
    },
  });
  return NextResponse.json(note);
} 