import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs';

// Email to Ticket conversion webhook
export const POST = async (request: NextRequest) => {
  try {
    // Verify webhook secret (you should set this in your environment)
    const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET;
    const authHeader = request.headers.get('authorization');
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Parse email data (this will depend on your email service provider)
    const {
      from,
      to,
      subject,
      text,
      html,
      attachments = [],
      messageId,
      timestamp,
      // Add any other fields your email service provides
    } = body;

    // Validate required email fields
    if (!from || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: "Missing required email fields: from, subject, and content" },
        { status: 400 }
      );
    }

    // Extract sender information
    const senderEmail = extractEmail(from);
    const senderName = extractName(from);
    
    // Check if this is a reply to an existing ticket
    const existingTicket = await findExistingTicket(subject, senderEmail);
    
    if (existingTicket) {
      // This is a reply - add as comment to existing ticket
      const comment = await prisma.ticketComment.create({
        data: {
          content: createReplyCommentContent(subject, text || html, from, timestamp),
          authorId: await getSystemUserId(),
          authorType: 'CUSTOMER',
          ticketId: existingTicket.id,
          isInternal: false,
        }
      });

      // Update ticket status if it was closed
      if (existingTicket.status === 'CLOSED' || existingTicket.status === 'RESOLVED') {
        await prisma.ticket.update({
          where: { id: existingTicket.id },
          data: { 
            status: 'OPEN',
            updatedAt: new Date()
          }
        });
      }

      // Send notification to assigned team about the reply
      await sendReplyNotification(existingTicket, senderEmail, senderName);

      return NextResponse.json({
        success: true,
        action: "reply_added",
        ticket: {
          id: existingTicket.id,
          ticketNumber: existingTicket.ticketNumber,
          title: existingTicket.title,
          status: existingTicket.status,
        },
        comment: {
          id: comment.id,
          content: comment.content,
        },
        message: "Email reply added to existing ticket"
      }, { status: 200 });
    }
    
    // This is a new email - create new ticket
    // Determine ticket category based on subject and content
    const category = determineTicketCategory(subject, text || html);
    
    // Determine priority based on subject and content
    const priority = determineTicketPriority(subject, text || html);
    
    // Generate ticket number
    const ticketNumber = await generateTicketNumber();
    
    // Create ticket description from email content
    const description = createTicketDescription(subject, text || html, from, timestamp);

    // Find a default assignee or team based on category
    const assignedTeam = determineAssignedTeam(category);
    
    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: subject,
        description,
        priority: priority as any,
        category: category as any,
        customerEmail: senderEmail,
        customerName: senderName,
        assignedTeam,
        tags: ['email-conversion', 'auto-generated'],
        createdById: await getSystemUserId(), // Use system user or default user
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

    // Create initial comment with email details
    await prisma.ticketComment.create({
      data: {
        content: `Ticket created from email:\n\nFrom: ${from}\nDate: ${timestamp || new Date().toISOString()}\nMessage ID: ${messageId || 'N/A'}\n\nOriginal Email Content:\n${text || html}`,
        authorId: await getSystemUserId(),
        authorType: 'SYSTEM',
        ticketId: ticket.id,
        isInternal: true,
      }
    });

    // Handle email attachments if any
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        // You'll need to implement file upload logic here
        // This is a placeholder for attachment handling
        console.log('Email attachment:', attachment);
      }
    }

    // Send notification to assigned team
    await sendTeamNotification(ticket, assignedTeam);

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
      },
      message: "Email successfully converted to ticket"
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing email webhook:', error);
    return NextResponse.json(
      { error: "Failed to process email webhook" },
      { status: 500 }
    );
  }
};

// Helper functions
function extractEmail(emailString: string): string {
  // Extract email from formats like "John Doe <john@example.com>" or "john@example.com"
  const emailMatch = emailString.match(/<(.+?)>/) || emailString.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return emailMatch ? emailMatch[1] || emailMatch[0] : emailString;
}

function extractName(emailString: string): string {
  // Extract name from formats like "John Doe <john@example.com>"
  const nameMatch = emailString.match(/^([^<]+)</);
  return nameMatch ? nameMatch[1].trim() : 'Unknown Sender';
}

function determineTicketCategory(subject: string, content: string): string {
  const subjectLower = subject.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Define category keywords
  const categoryKeywords = {
    'BUG': ['bug', 'error', 'crash', 'broken', 'not working', 'failed', 'issue'],
    'FEATURE_REQUEST': ['feature', 'enhancement', 'improvement', 'new', 'request'],
    'TECHNICAL_ISSUE': ['technical', 'system', 'server', 'database', 'api', 'integration'],
    'SUPPORT': ['help', 'support', 'question', 'how to', 'assistance'],
    'GENERAL': ['general', 'inquiry', 'info', 'information']
  };

  // Check subject and content for category keywords
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (subjectLower.includes(keyword) || contentLower.includes(keyword)) {
        return category;
      }
    }
  }

  return 'SUPPORT'; // Default category
}

function determineTicketPriority(subject: string, content: string): string {
  const subjectLower = subject.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Priority indicators
  const urgentKeywords = ['urgent', 'critical', 'emergency', 'asap', 'immediate', 'broken', 'down'];
  const highKeywords = ['important', 'high priority', 'blocking', 'urgent'];
  const lowKeywords = ['low priority', 'when possible', 'suggestion', 'nice to have'];

  // Check for urgent keywords
  for (const keyword of urgentKeywords) {
    if (subjectLower.includes(keyword) || contentLower.includes(keyword)) {
      return 'URGENT';
    }
  }

  // Check for high priority keywords
  for (const keyword of highKeywords) {
    if (subjectLower.includes(keyword) || contentLower.includes(keyword)) {
      return 'HIGH';
    }
  }

  // Check for low priority keywords
  for (const keyword of lowKeywords) {
    if (subjectLower.includes(keyword) || contentLower.includes(keyword)) {
      return 'LOW';
    }
  }

  return 'MEDIUM'; // Default priority
}

async function generateTicketNumber(): Promise<string> {
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

  if (lastTicket) {
    const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[3]);
    return `TIPA-HD-${dateString}-${String(lastNumber + 1).padStart(3, '0')}`;
  } else {
    return `TIPA-HD-${dateString}-001`;
  }
}

function createTicketDescription(subject: string, content: string, from: string, timestamp?: string): string {
  const emailDate = timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString();
  
  return `Email received from: ${from}
Date: ${emailDate}
Subject: ${subject}

Email Content:
${content}

---
This ticket was automatically created from an email sent to test-support.`;
}

function determineAssignedTeam(category: string): string {
  // Map categories to teams/departments
  const teamMapping: Record<string, string> = {
    'BUG': 'IS',
    'FEATURE_REQUEST': 'IS',
    'TECHNICAL_ISSUE': 'IS',
    'SUPPORT': 'CS',
    'GENERAL': 'CS'
  };

  return teamMapping[category] || 'CS';
}

async function getSystemUserId(): Promise<string> {
  // Find or create a system user for email conversions
  const systemUser = await prisma.user.findFirst({
    where: {
      username: 'system',
      role: 'ADMIN'
    }
  });

  if (systemUser) {
    return systemUser.id;
  }

  // If no system user exists, find any admin user
  const adminUser = await prisma.user.findFirst({
    where: {
      role: 'ADMIN'
    }
  });

  if (adminUser) {
    return adminUser.id;
  }

  // Fallback: create a system user (you might want to handle this differently)
  throw new Error('No system user found for email ticket creation');
}

async function findExistingTicket(subject: string, senderEmail: string): Promise<any> {
  try {
    // Clean subject line to remove common reply prefixes
    const cleanSubject = cleanSubjectLine(subject);
    
    // Look for existing tickets with similar subject and from the same sender
    const existingTickets = await prisma.ticket.findMany({
      where: {
        OR: [
          {
            title: {
              contains: cleanSubject,
              mode: 'insensitive'
            },
            customerEmail: senderEmail
          },
          {
            title: {
              contains: subject,
              mode: 'insensitive'
            },
            customerEmail: senderEmail
          }
        ],
        // Only look for tickets created in the last 30 days to avoid false matches
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    });

    return existingTickets.length > 0 ? existingTickets[0] : null;
  } catch (error) {
    console.error('Error finding existing ticket:', error);
    return null;
  }
}

function cleanSubjectLine(subject: string): string {
  // Remove common reply prefixes
  const replyPrefixes = [
    're:', 're :', 're-', 're -',
    'fw:', 'fw :', 'fw-', 'fw -',
    'fwd:', 'fwd :', 'fwd-', 'fwd -',
    'reply:', 'reply :', 'reply-', 'reply -'
  ];
  
  let cleanSubject = subject.toLowerCase().trim();
  
  for (const prefix of replyPrefixes) {
    if (cleanSubject.startsWith(prefix)) {
      cleanSubject = cleanSubject.substring(prefix.length).trim();
      break;
    }
  }
  
  return cleanSubject;
}

function createReplyCommentContent(subject: string, content: string, from: string, timestamp?: string): string {
  const emailDate = timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString();
  
  return `Email reply received from: ${from}
Date: ${emailDate}
Subject: ${subject}

Reply Content:
${content}

---
This comment was automatically added from an email reply.`;
}

async function sendReplyNotification(ticket: any, senderEmail: string, senderName: string): Promise<void> {
  try {
    // Find team members for the ticket's assigned team
    const teamMembers = await prisma.user.findMany({
      where: {
        department: ticket.assignedTeam || 'CS',
        role: {
          in: ['MANAGER', 'SENIOR_MANAGER', 'GENERAL_MANAGER', 'ADMIN']
        },
        isActive: true
      }
    });

    // Create notifications for team members
    for (const member of teamMembers) {
      await prisma.notification.create({
        data: {
          userId: member.id,
          title: `Email Reply: ${ticket.ticketNumber}`,
          message: `A reply has been received from ${senderName} (${senderEmail}) for ticket: "${ticket.title}"`,
          type: 'info',
          link: `/helpdesk/tickets/${ticket.id}`,
        }
      });
    }
  } catch (error) {
    console.error('Error sending reply notification:', error);
  }
}

async function sendTeamNotification(ticket: any, team: string): Promise<void> {
  try {
    // Find team members
    const teamMembers = await prisma.user.findMany({
      where: {
        department: team,
        role: {
          in: ['MANAGER', 'SENIOR_MANAGER', 'GENERAL_MANAGER', 'ADMIN']
        },
        isActive: true
      }
    });

    // Create notifications for team members
    for (const member of teamMembers) {
      await prisma.notification.create({
        data: {
          userId: member.id,
          title: `New Email Ticket: ${ticket.ticketNumber}`,
          message: `A new ticket has been created from an email: "${ticket.title}"`,
          type: 'info',
          link: `/helpdesk/tickets/${ticket.id}`,
        }
      });
    }
  } catch (error) {
    console.error('Error sending team notification:', error);
  }
} 