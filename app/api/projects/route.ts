import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Force Node.js runtime
export const runtime = 'nodejs'

type Project = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  departments: string[];
  approvalState: Record<string, string>;
  status: string;
  released: boolean;
  releasedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  documents?: Array<{
    id: string;
    fileName: string;
    filePath: string;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    let projects;
    if (id) {
      projects = await prisma.$queryRawUnsafe<Project[]>(
        `SELECT p.*, COALESCE(json_agg(d.*) FILTER (WHERE d.id IS NOT NULL), '[]') as documents 
          FROM projects p 
          LEFT JOIN documents d ON d."projectId" = p.id 
          WHERE p.id = '${id}'
          GROUP BY p.id 
          ORDER BY p."createdAt" DESC`
      );
    } else {
      projects = await prisma.$queryRawUnsafe<Project[]>(
        `SELECT p.*, COALESCE(json_agg(d.*) FILTER (WHERE d.id IS NOT NULL), '[]') as documents 
          FROM projects p 
          LEFT JOIN documents d ON d."projectId" = p.id 
          WHERE p."ownerId" = '${session.user.id}'
          GROUP BY p.id 
          ORDER BY p."createdAt" DESC`
      );
    }

    // Ensure approvalState is always an object and departments is always an array
    const projectsWithFixedFields = projects.map((proj: any) => {
      // Fix approvalState
      let approvalState = proj.approvalState;
      if (typeof approvalState === 'string') {
        try {
          approvalState = JSON.parse(approvalState);
        } catch {
          approvalState = {};
        }
      }
      if (!approvalState) approvalState = {};

      // Fix departments
      let departments = proj.departments;
      if (typeof departments === 'string') {
        departments = departments.replace(/[{}]/g, '').split(',').map((d: string) => d.trim()).filter(Boolean);
      }
      if (!Array.isArray(departments)) departments = [];

      return { ...proj, approvalState, departments };
    });

    return NextResponse.json(projectsWithFixedFields);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    // Ensure all department values are uppercase
    const departments = (body.departments || []).map((d: string) => d.toUpperCase());
    const [project] = await prisma.$queryRawUnsafe<Project[]>(
      `INSERT INTO projects (
          id,
          name,
          description,
          "ownerId",
          departments,
          "approvalState",
          status,
          released,
          "createdAt",
          "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          '${body.name}',
          '${body.description}',
          '${session.user.id}',
          ARRAY[${departments.map((d: string) => `'${d}'`).join(', ')}]::text[],
          '${(body.approvalState && Object.keys(body.approvalState).length > 0 ? JSON.stringify(body.approvalState) : '{}')}'::jsonb,
          'STARTED',
          false,
          NOW(),
          NOW()
        )
        RETURNING *`
    );

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
} 