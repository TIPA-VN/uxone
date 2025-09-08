import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reason, metadata } = body;

    // Get the contract
    const contract = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: true,
        currentApprover: true
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    let updateData: any = {};
    let eventType = '';
    let newStatus = contract.contractStatus;

    switch (action) {
      case 'HOLD':
        updateData = {
          isOnHold: true,
          holdReason: reason,
          holdDate: new Date(),
          holdByUserId: session.user.id,
          contractStatus: 'ON_HOLD'
        };
        eventType = 'HOLD';
        newStatus = 'ON_HOLD';
        break;

      case 'UNHOLD':
        updateData = {
          isOnHold: false,
          holdReason: null,
          holdDate: null,
          holdByUserId: null,
          contractStatus: contract.contractStatus === 'ON_HOLD' ? 'EXECUTING' : contract.contractStatus
        };
        eventType = 'UNHOLD';
        newStatus = contract.contractStatus === 'ON_HOLD' ? 'EXECUTING' : contract.contractStatus;
        break;

      case 'TERMINATE':
        updateData = {
          contractStatus: 'TERMINATED',
          terminationReason: reason,
          terminationDate: new Date(),
          terminatedByUserId: session.user.id
        };
        eventType = 'TERMINATE';
        newStatus = 'TERMINATED';
        break;

      case 'EXTEND_EXPIRATION':
        const { newExpirationDate } = body;
        if (!newExpirationDate) {
          return NextResponse.json({ error: 'New expiration date is required' }, { status: 400 });
        }
        updateData = {
          expirationDate: new Date(newExpirationDate)
        };
        eventType = 'EXTEND_EXPIRATION';
        break;

      case 'UPDATE_RENEWAL_SETTINGS':
        const { autoRenewal, renewalNoticeDays, expirationWarningDays } = body;
        updateData = {
          autoRenewal: autoRenewal !== undefined ? autoRenewal : contract.autoRenewal,
          renewalNoticeDays: renewalNoticeDays !== undefined ? renewalNoticeDays : contract.renewalNoticeDays,
          expirationWarningDays: expirationWarningDays !== undefined ? expirationWarningDays : contract.expirationWarningDays
        };
        eventType = 'UPDATE_RENEWAL_SETTINGS';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update contract in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update contract details
      const updatedContract = await tx.contractDetails.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          project: true,
          currentApprover: true,
          holdByUser: true,
          terminatedByUser: true,
          lifecycleEvents: {
            include: {
              user: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      // Create lifecycle event
      await tx.contractLifecycleEvent.create({
        data: {
          contractId: id,
          eventType,
          userId: session.user.id,
          reason,
          metadata: metadata || {}
        }
      });

      return updatedContract;
    });

    // Create notification if needed
    if (action === 'HOLD' || action === 'TERMINATE') {
      // Notify relevant stakeholders
      const notificationData = {
        title: `Contract ${action === 'HOLD' ? 'Put on Hold' : 'Terminated'}`,
        message: `Contract ${contract.contractNumber || contract.contractTitle} has been ${action === 'HOLD' ? 'put on hold' : 'terminated'}${reason ? `: ${reason}` : ''}`,
        type: 'CONTRACT_LIFECYCLE',
        link: `/contracts/${id}`
      };

      // Notify contract owner and approvers
      const userIds = [
        contract.project?.ownerId,
        contract.currentApproverId
      ].filter(Boolean);

      for (const userId of userIds) {
        if (userId && userId !== session.user.id) {
          await prisma.notification.create({
            data: {
              userId: userId as string,
              ...notificationData
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      contract: result,
      message: `Contract ${action.toLowerCase()}${action === 'HOLD' ? ' put on hold' : action === 'UNHOLD' ? ' resumed' : action === 'TERMINATE' ? 'd' : 'd'} successfully`
    });

  } catch (error) {
    console.error('Error updating contract lifecycle:', error);
    return NextResponse.json(
      { error: 'Failed to update contract lifecycle' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get contract lifecycle events
    const events = await prisma.contractLifecycleEvent.findMany({
      where: { contractId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      events
    });

  } catch (error) {
    console.error('Error fetching contract lifecycle events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lifecycle events' },
      { status: 500 }
    );
  }
}
