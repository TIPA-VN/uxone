import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const days = parseInt(searchParams.get('days') || '30');

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    if (action === 'list') {
      // Get contracts expiring within the specified days
      const expiringContracts = await prisma.contractDetails.findMany({
        where: {
          expirationDate: {
            gte: now,
            lte: futureDate
          },
          contractStatus: {
            in: ['SIGNED', 'EXECUTING']
          },
          isOnHold: false
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          currentApprover: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          expirationDate: 'asc'
        }
      });

      // Calculate days until expiration for each contract
      const contractsWithDaysLeft = expiringContracts.map(contract => {
        const daysLeft = Math.ceil(
          (new Date(contract.expirationDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          ...contract,
          daysUntilExpiration: daysLeft,
          isUrgent: daysLeft <= (contract.expirationWarningDays || 30),
          isCritical: daysLeft <= 7
        };
      });

      return NextResponse.json({
        success: true,
        contracts: contractsWithDaysLeft,
        summary: {
          total: contractsWithDaysLeft.length,
          critical: contractsWithDaysLeft.filter(c => c.isCritical).length,
          urgent: contractsWithDaysLeft.filter(c => c.isUrgent).length
        }
      });

    } else if (action === 'send-notifications') {
      // Send expiration notifications
      const contractsNeedingNotification = await prisma.contractDetails.findMany({
        where: {
          expirationDate: {
            gte: now,
            lte: futureDate
          },
          contractStatus: {
            in: ['SIGNED', 'EXECUTING']
          },
          isOnHold: false,
          OR: [
            { lastExpirationNotice: null },
            {
              lastExpirationNotice: {
                lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last notification was more than 24 hours ago
              }
            }
          ]
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          currentApprover: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      let notificationsSent = 0;

      for (const contract of contractsNeedingNotification) {
        const daysLeft = Math.ceil(
          (new Date(contract.expirationDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const warningDays = contract.expirationWarningDays || 30;
        
        // Only send notification if within warning period
        if (daysLeft <= warningDays) {
          const notificationData = {
            title: `Contract Expiring Soon`,
            message: `Contract "${contract.contractTitle || contract.contractNumber}" expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
            type: 'CONTRACT_EXPIRATION',
            link: `/contracts/${contract.id}`
          };

          // Notify contract owner
          if (contract.project?.owner?.id) {
            await prisma.notification.create({
              data: {
                userId: contract.project.owner.id,
                ...notificationData
              }
            });
            notificationsSent++;
          }

          // Notify current approver if different from owner
          if (contract.currentApprover?.id && contract.currentApprover.id !== contract.project?.owner?.id) {
            await prisma.notification.create({
              data: {
                userId: contract.currentApprover.id,
                ...notificationData
              }
            });
            notificationsSent++;
          }

          // Update last notification date and create lifecycle event
          await prisma.$transaction(async (tx) => {
            await tx.contractDetails.update({
              where: { id: contract.id },
              data: { lastExpirationNotice: now }
            });

            await tx.contractLifecycleEvent.create({
              data: {
                contractId: contract.id,
                eventType: 'EXPIRATION_WARNING',
                userId: session.user.id,
                reason: `Expiration warning sent - ${daysLeft} days remaining`,
                metadata: {
                  daysLeft,
                  warningDays,
                  expirationDate: contract.expirationDate
                }
              }
            });
          });
        }
      }

      return NextResponse.json({
        success: true,
        notificationsSent,
        contractsProcessed: contractsNeedingNotification.length
      });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in expiration monitor:', error);
    return NextResponse.json(
      { error: 'Failed to process expiration monitor request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contractIds, action } = body;

    if (!contractIds || !Array.isArray(contractIds)) {
      return NextResponse.json({ error: 'Contract IDs array is required' }, { status: 400 });
    }

    if (action === 'bulk-extend') {
      const { extensionDays, reason } = body;
      
      if (!extensionDays || extensionDays <= 0) {
        return NextResponse.json({ error: 'Valid extension days required' }, { status: 400 });
      }

      const results = [];

      for (const contractId of contractIds) {
        try {
          const contract = await prisma.contractDetails.findUnique({
            where: { id: contractId }
          });

          if (!contract || !contract.expirationDate) {
            results.push({ contractId, success: false, error: 'Contract not found or no expiration date' });
            continue;
          }

          const newExpirationDate = new Date(contract.expirationDate);
          newExpirationDate.setDate(newExpirationDate.getDate() + extensionDays);

          await prisma.$transaction(async (tx) => {
            await tx.contractDetails.update({
              where: { id: contractId },
              data: {
                expirationDate: newExpirationDate,
                updatedAt: new Date()
              }
            });

            await tx.contractLifecycleEvent.create({
              data: {
                contractId,
                eventType: 'EXTEND_EXPIRATION',
                userId: session.user.id,
                reason: reason || `Extended by ${extensionDays} days`,
                metadata: {
                  extensionDays,
                  oldExpirationDate: contract.expirationDate,
                  newExpirationDate
                }
              }
            });
          });

          results.push({ contractId, success: true });
        } catch (error) {
          results.push({ contractId, success: false, error: 'Failed to extend contract' });
        }
      }

      return NextResponse.json({
        success: true,
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in bulk expiration operations:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    );
  }
}
