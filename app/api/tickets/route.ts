import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// GET /api/tickets - Get all tickets with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if this is a fallback authentication session
    const isFallbackAuth = (session.user as any).isFallbackAuth;
    if (isFallbackAuth) {
      return NextResponse.json({ tickets: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const assignedTo = searchParams.get("assignedTo");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedTo) where.assignedToId = assignedTo;
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get tickets with pagination
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
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
            select: {
              id: true,
              content: true,
              authorType: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticket.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      tickets,
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
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      title,
      description,
      priority = 'MEDIUM',
      category = 'SUPPORT',
      customerEmail,
      customerName,
      customerId,
      assignedToId,
      assignedTeam,
      tags = [],
    } = body;

    // Validate required fields
    if (!title || !description || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, customerEmail, customerName" },
        { status: 400 }
      );
    }

    // Generate ticket number (TIPA-HD-YYMMDD-XXX format)
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    const lastTicket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: {
          startsWith: `TIPA-HD-${dateString}-`
        }
      },
      orderBy: {
        ticketNumber: 'desc'
      }
    });

    let ticketNumber;
    if (lastTicket) {
      const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[3]);
      ticketNumber = `TIPA-HD-${dateString}-${String(lastNumber + 1).padStart(3, '0')}`;
    } else {
      ticketNumber = `TIPA-HD-${dateString}-001`;
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        priority,
        category,
        customerEmail,
        customerName,
        customerId,
        assignedToId,
        assignedTeam,
        tags,
        createdById: session.user.id,
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

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
} 