import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeRange = parseInt(searchParams.get('timeRange') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // Get basic counts
    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      closedTickets,
      ticketsByStatus,
      ticketsByPriority,
      ticketsByCategory,
      ticketsByMonth,
      topAssignees
    ] = await Promise.all([
      // Total tickets
      prisma.ticket.count(),
      
      // Open tickets
      prisma.ticket.count({
        where: { status: 'OPEN' }
      }),
      
      // Resolved tickets
      prisma.ticket.count({
        where: { status: 'RESOLVED' }
      }),
      
      // Closed tickets
      prisma.ticket.count({
        where: { status: 'CLOSED' }
      }),
      
      // Tickets by status
      prisma.ticket.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Tickets by priority
      prisma.ticket.groupBy({
        by: ['priority'],
        _count: { priority: true }
      }),
      
      // Tickets by category
      prisma.ticket.groupBy({
        by: ['category'],
        _count: { category: true }
      }),
      
      // Tickets by month (last 6 months)
      prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') as month,
          COUNT(*) as count
        FROM tickets 
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 6
      `,
      
      // Top assignees
      prisma.ticket.groupBy({
        by: ['assignedToId'],
        _count: { assignedToId: true },
        where: {
          assignedToId: { not: null }
        }
      })
    ]);

    // Calculate average resolution time
    const resolvedTicketsWithTime = await prisma.ticket.findMany({
      where: {
        status: 'RESOLVED',
        updatedAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    const averageResolutionTime = resolvedTicketsWithTime.length > 0 
      ? resolvedTicketsWithTime.reduce((acc, ticket) => {
          const resolutionTime = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
          return acc + resolutionTime;
        }, 0) / resolvedTicketsWithTime.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Get assignee names for top assignees
    const assigneeIds = topAssignees.map(item => item.assignedToId).filter(Boolean);
    const assignees = await prisma.user.findMany({
      where: { id: { in: assigneeIds as string[] } },
      select: { id: true, name: true }
    });

    const assigneeMap = new Map(assignees.map(user => [user.id, user.name]));

    return NextResponse.json({
      totalTickets,
      openTickets,
      resolvedTickets,
      closedTickets,
      averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
      ticketsByStatus: ticketsByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      ticketsByPriority: ticketsByPriority.map(item => ({
        priority: item.priority,
        count: item._count.priority
      })),
      ticketsByCategory: ticketsByCategory.map(item => ({
        category: item.category,
        count: item._count.category
      })),
      ticketsByMonth: (ticketsByMonth as any[]).map(item => ({
        month: item.month,
        count: parseInt(item.count)
      })),
      topAssignees: topAssignees
        .map(item => ({
          name: assigneeMap.get(item.assignedToId as string) || 'Unknown',
          count: item._count.assignedToId
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 });
  }
}
