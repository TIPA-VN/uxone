import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withRBAC } from "@/lib/rbac";
import { canUserAccessTicket, canUserUpdateTicket, canUserDeleteTicket, canTransitionTicketStatus } from "@/lib/rbac";

export const runtime = 'nodejs';

// GET /api/tickets/[id] - Get a specific ticket
export const GET = withRBAC(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
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

    // Check if user can access this ticket
    if (!canUserAccessTicket(session.user.role, session.user.department || 'UNKNOWN', ticket, session.user.id)) {
      return NextResponse.json({ error: "Access denied to this ticket" }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}, "helpdesk:read");

// PATCH /api/tickets/[id] - Update a ticket
export const PATCH = withRBAC(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
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

    // Check if user can update this ticket
    if (!canUserUpdateTicket(session.user.role, existingTicket, session.user.id)) {
      return NextResponse.json({ error: "Insufficient permissions to update this ticket" }, { status: 403 });
    }

    // Validate status transition if status is being updated
    if (status && status !== existingTicket.status) {
      if (!canTransitionTicketStatus(session.user.role, existingTicket.status, status)) {
        return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
      }
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
}, "helpdesk:update");

// DELETE /api/tickets/[id] - Delete a ticket
export const DELETE = withRBAC(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
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

    // Check if user can delete this ticket
    if (!canUserDeleteTicket(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions to delete tickets" }, { status: 403 });
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
}, "helpdesk:delete"); 