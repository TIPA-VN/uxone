import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// GET /api/tickets/[id]/comments - Get comments for a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this is a fallback authentication session
    const isFallbackAuth = (session.user as any).isFallbackAuth;
    if (isFallbackAuth) {
      return NextResponse.json([]);
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const internalOnly = searchParams.get("internalOnly") === "true";

    // Build where clause
    const where: any = {
      ticketId: id,
    };

    if (internalOnly) {
      where.isInternal = true;
    }

    // Get comments with pagination
    const [comments, total] = await Promise.all([
      prisma.ticketComment.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticketComment.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      comments,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });
  } catch (error) {
    console.error('Error fetching ticket comments:', error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/tickets/[id]/comments - Add a comment to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this is a fallback authentication session
    const isFallbackAuth = (session.user as any).isFallbackAuth;
    if (isFallbackAuth) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      content,
      authorType = 'AGENT',
      isInternal = false,
    } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Create the comment
    const comment = await prisma.ticketComment.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        authorType,
        ticketId: id,
        isInternal,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    });

    // Update ticket's firstResponseAt if this is the first agent comment
    if (authorType === 'AGENT' && !comment.isInternal) {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        select: { firstResponseAt: true, createdAt: true }
      });

      if (ticket && !ticket.firstResponseAt) {
        const now = new Date();
        await prisma.ticket.update({
          where: { id },
          data: {
            firstResponseAt: now,
            responseTime: Math.floor((now.getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60))
          }
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket comment:', error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
} 