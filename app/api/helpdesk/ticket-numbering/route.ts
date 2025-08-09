import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface TicketNumberingConfig {
  emailPrefix: string;
  manualPrefix: string;
  emailSequencePadding: number;
  manualSequencePadding: number;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin privileges
    const userRole = session.user.role?.toUpperCase();
    const userDepartment = session.user.department?.toUpperCase();
    
    if (!(userRole === 'ADMIN' || userRole === 'SENIOR MANAGER' || userRole === 'SENIOR_MANAGER') || userDepartment !== 'IS') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get configuration from database
    const configs = await prisma.systemConfig.findMany({
      where: {
        category: 'ticket_numbering',
        isActive: true
      }
    });

    // Convert to object format
    const config: TicketNumberingConfig = {
      emailPrefix: 'TIPA-HD',
      manualPrefix: 'TKT',
      emailSequencePadding: 3,
      manualSequencePadding: 6
    };

    configs.forEach((item) => {
      if (item.key === 'email_prefix') config.emailPrefix = item.value;
      if (item.key === 'manual_prefix') config.manualPrefix = item.value;
      if (item.key === 'email_sequence_padding') config.emailSequencePadding = parseInt(item.value);
      if (item.key === 'manual_sequence_padding') config.manualSequencePadding = parseInt(item.value);
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching ticket numbering config:', error);
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin privileges
    const userRole = session.user.role?.toUpperCase();
    const userDepartment = session.user.department?.toUpperCase();
    
    if (!(userRole === 'ADMIN' || userRole === 'SENIOR MANAGER' || userRole === 'SENIOR_MANAGER') || userDepartment !== 'IS') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { emailPrefix, manualPrefix, emailSequencePadding, manualSequencePadding } = body;

    // Validate input
    if (!emailPrefix || !manualPrefix) {
      return NextResponse.json({ error: "Email prefix and manual prefix are required" }, { status: 400 });
    }

    if (emailSequencePadding < 1 || emailSequencePadding > 5) {
      return NextResponse.json({ error: "Email sequence padding must be between 1 and 5" }, { status: 400 });
    }

    if (manualSequencePadding < 1 || manualSequencePadding > 8) {
      return NextResponse.json({ error: "Manual sequence padding must be between 1 and 8" }, { status: 400 });
    }

    // Update or create configuration in database
    const configs = [
      {
        key: 'email_prefix',
        value: emailPrefix,
        description: 'Email-based ticket prefix',
        category: 'ticket_numbering'
      },
      {
        key: 'manual_prefix',
        value: manualPrefix,
        description: 'Manual ticket prefix',
        category: 'ticket_numbering'
      },
      {
        key: 'email_sequence_padding',
        value: emailSequencePadding.toString(),
        description: 'Email ticket sequence padding',
        category: 'ticket_numbering'
      },
      {
        key: 'manual_sequence_padding',
        value: manualSequencePadding.toString(),
        description: 'Manual ticket sequence padding',
        category: 'ticket_numbering'
      }
    ];

    // Use transaction to update all configs
    await prisma.$transaction(async (tx) => {
      for (const config of configs) {
        await tx.systemConfig.upsert({
          where: { key: config.key },
          update: {
            value: config.value,
            updatedAt: new Date(),
            updatedBy: session.user.id
          },
          create: {
            key: config.key,
            value: config.value,
            description: config.description,
            category: config.category,
            updatedBy: session.user.id
          }
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Ticket numbering configuration updated successfully",
      config: {
        emailPrefix,
        manualPrefix,
        emailSequencePadding,
        manualSequencePadding
      }
    });
  } catch (error) {
    console.error('Error updating ticket numbering config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
