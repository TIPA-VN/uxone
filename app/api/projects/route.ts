import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // List all projects (MVP: all, later: filter by access)
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, description, departments } = await req.json();
  if (!name || !departments || !Array.isArray(departments) || departments.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  // Initialize approvalState: { department: "pending" }
  const approvalState: Record<string, string> = {};
  departments.forEach((d: string) => { approvalState[d] = "pending"; });
  const project = await prisma.project.create({
    data: {
      name,
      description,
      ownerId: session.user.id,
      departments,
      approvalState,
      status: "started",
    },
  });
  return NextResponse.json(project);
} 