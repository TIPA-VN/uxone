import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TicketNumberGenerator } from "@/lib/ticketNumberGenerator";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const assignedTo = searchParams.get('assignedTo');
    const department = searchParams.get('department');

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    if (category && category !== 'all') {
      where.category = category;
    }
    if (assignedTo && assignedTo !== 'all') {
      where.assignedToId = assignedTo;
    }
    
    // Filter by department if specified
    if (department && department !== 'all') {
      console.log('🔍 Filtering tickets by department:', department);
      where.OR = [
        // Filter by tickets created by users from the specified department
        {
          createdBy: {
            department: department
          }
        },
        // Filter by tickets assigned to users from the specified department
        {
          assignedTo: {
            department: department
          }
        }
      ];
      console.log('🔍 Where clause for department filter:', JSON.stringify(where, null, 2));
    } else {
      console.log('🔍 No department filter applied - showing all tickets');
    }

    console.log('🔍 Executing Prisma query with where clause:', JSON.stringify(where, null, 2));
    
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('🔍 Found tickets:', tickets.length);
    if (tickets.length > 0) {
      console.log('🔍 Sample ticket departments:', {
        createdBy: tickets[0].createdBy?.department || 'N/A',
        assignedTo: tickets[0].assignedTo?.department || 'N/A'
      });
    }

    // Transform the data to match the expected format
    const transformedTickets = tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignedTo: ticket.assignedTo,
      createdBy: ticket.createdBy,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      commentCount: ticket._count.comments,
    }));

    return NextResponse.json({ tickets: transformedTickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, priority, category, assignedToId, customerEmail, customerName } = body;

    if (!title || !description || !customerEmail || !customerName) {
      return NextResponse.json({ error: "Title, description, customer email, and customer name are required" }, { status: 400 });
    }

    // Generate ticket number
    const ticketNumber = await TicketNumberGenerator.generateManualTicket();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        priority: priority || 'MEDIUM',
        category: category || 'GENERAL',
        status: 'OPEN',
        customerEmail,
        customerName,
        createdById: session.user.id,
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
} 