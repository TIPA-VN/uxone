import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// POST /api/tickets/[id]/convert-to-task - Convert ticket to task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const body = await request.json();
    const {
      projectId,
      assigneeId,
      priority,
      estimatedHours,
      createSubtasks = false,
      taskTemplate,
      conversionReason = "Converted from helpdesk ticket",
      taskType = "investigation"
    } = body;

    // Get the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            username: true,
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

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Map ticket priority to task priority
    const mapTicketPriorityToTask = (ticketPriority: string) => {
      switch (ticketPriority) {
        case 'URGENT': return 'URGENT';
        case 'HIGH': return 'HIGH';
        case 'MEDIUM': return 'MEDIUM';
        case 'LOW': return 'LOW';
        default: return 'MEDIUM';
      }
    };

    // Create task data
    const taskData = {
      title: `[${ticket.ticketNumber}] ${ticket.title}`,
      description: `Created from helpdesk ticket: ${ticket.description}\n\n**Ticket Details:**\n- Customer: ${ticket.customerName} (${ticket.customerEmail})\n- Category: ${ticket.category}\n- Priority: ${ticket.priority}\n- Conversion Reason: ${conversionReason}`,
      projectId: projectId || null,
      sourceTicketId: ticket.id,
      ticketIntegration: {
        ticketId: ticket.id,
        convertedBy: session.user.id,
        conversionReason,
        taskType,
        estimatedEffort: estimatedHours,
        originalTicket: {
          ticketNumber: ticket.ticketNumber,
          customerName: ticket.customerName,
          customerEmail: ticket.customerEmail,
          category: ticket.category,
          priority: ticket.priority,
        }
      },
      priority: priority || mapTicketPriorityToTask(ticket.priority),
      assigneeId: assigneeId || ticket.assignedToId,
      ownerId: ticket.assignedToId || session.user.id,
      creatorId: session.user.id,
      status: 'TODO' as const,
    };

    // Create the main task
    const task = await prisma.task.create({
      data: taskData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
      }
    });

    // Update ticket with task reference
    await prisma.ticket.update({
      where: { id: params.id },
      data: {
        relatedTasks: {
          push: task.id
        },
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
      }
    });

    // Create subtasks if requested
    let subtasks: any[] = [];
    if (createSubtasks) {
      const subtaskTemplates = [
        {
          title: "Investigate Issue",
          description: "Analyze the root cause of the reported issue",
          status: 'TODO' as const,
          priority: task.priority,
        },
        {
          title: "Develop Solution",
          description: "Create the fix or solution for the issue",
          status: 'TODO' as const,
          priority: task.priority,
        },
        {
          title: "Test Solution",
          description: "Verify the solution works correctly",
          status: 'TODO' as const,
          priority: task.priority,
        },
        {
          title: "Deploy Solution",
          description: "Implement the solution in production",
          status: 'TODO' as const,
          priority: task.priority,
        }
      ];

      subtasks = await Promise.all(
        subtaskTemplates.map(async (subtaskTemplate) => {
          return await prisma.task.create({
            data: {
              ...subtaskTemplate,
              projectId: task.projectId,
              assigneeId: task.assigneeId,
              ownerId: task.ownerId,
              creatorId: session.user.id,
              parentTaskId: task.id,
              sourceTicketId: ticket.id,
            },
            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                }
              },
            }
          });
        })
      );
    }

    // Add a system comment to the ticket
    await prisma.ticketComment.create({
      data: {
        content: `Ticket converted to task: [${task.title}](tasks/${task.id})\n\n**Task Details:**\n- Project: ${task.project?.name || 'No project assigned'}\n- Assignee: ${task.assignee?.name || 'Unassigned'}\n- Priority: ${task.priority}\n- Conversion Reason: ${conversionReason}`,
        authorId: session.user.id,
        authorType: 'SYSTEM',
        ticketId: ticket.id,
        isInternal: true,
      }
    });

    return NextResponse.json({
      task,
      subtasks,
      message: "Ticket successfully converted to task"
    }, { status: 201 });
  } catch (error) {
    console.error('Error converting ticket to task:', error);
    return NextResponse.json(
      { error: "Failed to convert ticket to task" },
      { status: 500 }
    );
  }
} 