import { prisma } from '@/lib/prisma';

export interface ExpirationCheckResult {
  contractsChecked: number;
  notificationsSent: number;
  criticalContracts: number;
  errors: string[];
}

export class ContractExpirationService {
  /**
   * Check for expiring contracts and send notifications
   */
  static async checkExpiringContracts(): Promise<ExpirationCheckResult> {
    const result: ExpirationCheckResult = {
      contractsChecked: 0,
      notificationsSent: 0,
      criticalContracts: 0,
      errors: []
    };

    try {
      const now = new Date();
      
      // Get contracts that need expiration warnings
      const contractsToCheck = await prisma.contractDetails.findMany({
        where: {
          expirationDate: {
            gte: now, // Only future dates
            lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // Within 90 days
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
        }
      });

      result.contractsChecked = contractsToCheck.length;

      for (const contract of contractsToCheck) {
        try {
          const daysUntilExpiration = Math.ceil(
            (new Date(contract.expirationDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const warningDays = contract.expirationWarningDays || 30;
          const renewalDays = contract.renewalNoticeDays || 60;
          
          // Track critical contracts (≤7 days)
          if (daysUntilExpiration <= 7) {
            result.criticalContracts++;
          }

          // Check if we should send notifications
          const shouldSendWarning = daysUntilExpiration <= warningDays;
          const shouldSendRenewalNotice = contract.autoRenewal && daysUntilExpiration <= renewalDays;
          
          // Check if notification was already sent recently (within 24 hours)
          const lastNotification = contract.lastExpirationNotice;
          const shouldSkipDueToRecentNotification = lastNotification && 
            (now.getTime() - new Date(lastNotification).getTime()) < (24 * 60 * 60 * 1000);

          if ((shouldSendWarning || shouldSendRenewalNotice) && !shouldSkipDueToRecentNotification) {
            await this.sendExpirationNotifications(contract, daysUntilExpiration, shouldSendRenewalNotice);
            result.notificationsSent++;

            // Update last notification timestamp
            await prisma.contractDetails.update({
              where: { id: contract.id },
              data: { lastExpirationNotice: now }
            });

            // Create lifecycle event
            await prisma.contractLifecycleEvent.create({
              data: {
                contractId: contract.id,
                eventType: shouldSendRenewalNotice ? 'RENEWAL_NOTICE' : 'EXPIRATION_WARNING',
                userId: 'system', // System user ID - you may want to create a system user
                reason: `${shouldSendRenewalNotice ? 'Renewal notice' : 'Expiration warning'} sent - ${daysUntilExpiration} days remaining`,
                metadata: {
                  daysLeft: daysUntilExpiration,
                  warningDays,
                  renewalDays,
                  expirationDate: contract.expirationDate,
                  autoRenewal: contract.autoRenewal
                }
              }
            });
          }
        } catch (error) {
          result.errors.push(`Error processing contract ${contract.id}: ${error}`);
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`General error in expiration check: ${error}`);
      return result;
    }
  }

  /**
   * Send expiration notifications to stakeholders
   */
  private static async sendExpirationNotifications(
    contract: any, 
    daysUntilExpiration: number, 
    isRenewalNotice: boolean
  ): Promise<void> {
    const notificationData = {
      title: isRenewalNotice ? 'Contract Renewal Notice' : 'Contract Expiring Soon',
      message: `Contract "${contract.contractTitle || contract.contractNumber}" ${
        isRenewalNotice ? 'is eligible for renewal and' : ''
      } expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}`,
      type: isRenewalNotice ? 'CONTRACT_RENEWAL' : 'CONTRACT_EXPIRATION',
      link: `/contracts/${contract.id}`
    };

    const notificationsToSend = [];

    // Notify contract owner
    if (contract.project?.owner?.id) {
      notificationsToSend.push({
        userId: contract.project.owner.id,
        ...notificationData
      });
    }

    // Notify current approver if different from owner
    if (contract.currentApprover?.id && contract.currentApprover.id !== contract.project?.owner?.id) {
      notificationsToSend.push({
        userId: contract.currentApprover.id,
        ...notificationData
      });
    }

    // Send all notifications
    if (notificationsToSend.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToSend
      });
    }
  }

  /**
   * Get expiration summary for dashboard
   */
  static async getExpirationSummary(days: number = 90) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const contracts = await prisma.contractDetails.findMany({
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
      select: {
        id: true,
        expirationDate: true,
        expirationWarningDays: true
      }
    });

    const summary = {
      total: contracts.length,
      critical: 0,
      urgent: 0,
      normal: 0
    };

    for (const contract of contracts) {
      const daysLeft = Math.ceil(
        (new Date(contract.expirationDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft <= 7) {
        summary.critical++;
      } else if (daysLeft <= (contract.expirationWarningDays || 30)) {
        summary.urgent++;
      } else {
        summary.normal++;
      }
    }

    return summary;
  }

  /**
   * Auto-renew eligible contracts
   */
  static async processAutoRenewals(): Promise<{ renewed: number; errors: string[] }> {
    const result = { renewed: 0, errors: [] };

    try {
      const now = new Date();
      const renewalWindow = new Date();
      renewalWindow.setDate(now.getDate() + 7); // Auto-renew 7 days before expiration

      const contractsToRenew = await prisma.contractDetails.findMany({
        where: {
          autoRenewal: true,
          expirationDate: {
            gte: now,
            lte: renewalWindow
          },
          contractStatus: {
            in: ['SIGNED', 'EXECUTING']
          },
          isOnHold: false,
          // Only renew if not already processed recently
          OR: [
            { lastExpirationNotice: null },
            {
              lastExpirationNotice: {
                lt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
              }
            }
          ]
        }
      });

      for (const contract of contractsToRenew) {
        try {
          // Calculate new expiration date (extend by 1 year by default)
          const currentExpiration = new Date(contract.expirationDate!);
          const newExpiration = new Date(currentExpiration);
          newExpiration.setFullYear(currentExpiration.getFullYear() + 1);

          // Update contract
          await prisma.$transaction(async (tx) => {
            await tx.contractDetails.update({
              where: { id: contract.id },
              data: {
                expirationDate: newExpiration,
                lastExpirationNotice: now,
                updatedAt: now
              }
            });

            // Create lifecycle event
            await tx.contractLifecycleEvent.create({
              data: {
                contractId: contract.id,
                eventType: 'AUTO_RENEWAL',
                userId: 'system',
                reason: 'Contract automatically renewed for 1 year',
                metadata: {
                  oldExpirationDate: contract.expirationDate,
                  newExpirationDate: newExpiration,
                  renewalType: 'automatic'
                }
              }
            });
          });

          result.renewed++;
        } catch (error) {
          result.errors.push(`Error renewing contract ${contract.id}: ${error}`);
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`General error in auto-renewal: ${error}`);
      return result;
    }
  }
}
