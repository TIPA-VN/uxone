import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// GET /api/tickets/[id] - Get a specific ticket
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
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
        comments: {
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
          }
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// PATCH /api/tickets/[id] - Update a ticket
export async function PATCH(
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
      title,
      description,
      status,
      priority,
      category,
      customerEmail,
      customerName,
      customerId,
      assignedToId,
      assignedTeam,
      tags,
      resolvedAt,
      closedAt,
      firstResponseAt,
      slaBreached,
      responseTime,
      resolutionTime,
    } = body;

    // Check if ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(category && { category }),
        ...(customerEmail && { customerEmail }),
        ...(customerName && { customerName }),
        ...(customerId !== undefined && { customerId }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(assignedTeam && { assignedTeam }),
        ...(tags && { tags }),
        ...(resolvedAt && { resolvedAt: new Date(resolvedAt) }),
        ...(closedAt && { closedAt: new Date(closedAt) }),
        ...(firstResponseAt && { firstResponseAt: new Date(firstResponseAt) }),
        ...(slaBreached !== undefined && { slaBreached }),
        ...(responseTime !== undefined && { responseTime }),
        ...(resolutionTime !== undefined && { resolutionTime }),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
      }
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id] - Delete a ticket
export async function DELETE(
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

    // Check if ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Delete ticket (cascade will handle comments and attachments)
    await prisma.ticket.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: "Failed to delete ticket" },
      { status: 500 }
    );
  }
} 