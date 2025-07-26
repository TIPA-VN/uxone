import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documentId = params.id;
  
  console.log('Loading annotations for document:', documentId);
  
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { annotations: true }
    });

    if (!document) {
      console.log('Document not found:', documentId);
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    console.log('Annotations loaded from database:', JSON.stringify(document.annotations, null, 2));

    return NextResponse.json({ 
      canvasData: document.annotations || null 
    });
  } catch (error) {
    console.error('Error fetching annotations:', error);
    return NextResponse.json({ error: "Failed to fetch annotations" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documentId = params.id;
  const { canvasData } = await req.json();

  console.log('Saving annotations for document:', documentId);
  console.log('Canvas data received:', JSON.stringify(canvasData, null, 2));

  if (!canvasData) {
    return NextResponse.json({ error: "Canvas data is required" }, { status: 400 });
  }

  try {
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: { annotations: canvasData },
      select: { id: true, annotations: true }
    });

    console.log('Annotations saved successfully:', JSON.stringify(updatedDocument.annotations, null, 2));

    return NextResponse.json({ 
      success: true, 
      annotations: updatedDocument.annotations 
    });
  } catch (error) {
    console.error('Error saving annotations:', error);
    return NextResponse.json({ error: "Failed to save annotations" }, { status: 500 });
  }
} 