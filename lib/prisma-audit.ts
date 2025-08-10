import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

/**
 * Utility functions for automatically updating audit fields
 */
export class PrismaAudit {
  /**
   * Get the current user's information for audit fields
   */
  static async getCurrentUserInfo() {
    try {
      const session = await auth();
      if (!session?.user) {
        return {
          userId: null,
          userName: 'System'
        };
      }

      return {
        userId: session.user.id,
        userName: session.user.name || session.user.username || 'Unknown'
      };
    } catch (error) {
      return {
        userId: null,
        userName: 'System'
      };
    }
  }

  /**
   * Update audit fields for a record
   */
  static async updateAuditFields<T extends { lastUpdatedBy?: string | null; lastUpdatedById?: string | null }>(
    prisma: PrismaClient,
    model: any,
    recordId: string,
    data: Partial<T>
  ): Promise<T> {
    const userInfo = await this.getCurrentUserInfo();
    
    const auditData = {
      ...data,
      lastUpdatedBy: userInfo.userName,
      lastUpdatedById: userInfo.userId
    };

    return await model.update({
      where: { id: recordId },
      data: auditData
    });
  }

  /**
   * Create a record with audit fields
   */
  static async createWithAudit<T extends { lastUpdatedBy?: string | null; lastUpdatedById?: string | null }>(
    prisma: PrismaClient,
    model: any,
    data: Omit<T, 'lastUpdatedBy' | 'lastUpdatedById'>
  ): Promise<T> {
    const userInfo = await this.getCurrentUserInfo();
    
    const auditData = {
      ...data,
      lastUpdatedBy: userInfo.userName,
      lastUpdatedById: userInfo.userId
    };

    return await model.create({
      data: auditData
    });
  }

  /**
   * Update multiple records with audit fields
   */
  static async updateManyWithAudit<T extends { lastUpdatedBy?: string | null; lastUpdatedById?: string | null }>(
    prisma: PrismaClient,
    model: any,
    where: any,
    data: Partial<Omit<T, 'lastUpdatedBy' | 'lastUpdatedById'>>
  ): Promise<{ count: number }> {
    const userInfo = await this.getCurrentUserInfo();
    
    const auditData = {
      ...data,
      lastUpdatedBy: userInfo.userName,
      lastUpdatedById: userInfo.userId
    };

    return await model.updateMany({
      where,
      data: auditData
    });
  }
}

/**
 * Higher-order function to wrap Prisma operations with audit fields
 */
export function withAudit<T extends { lastUpdatedBy?: string | null; lastUpdatedById?: string | null }>(
  operation: (data: T) => Promise<T>
) {
  return async (data: T): Promise<T> => {
    const userInfo = await PrismaAudit.getCurrentUserInfo();
    
    const auditData = {
      ...data,
      lastUpdatedBy: userInfo.userName,
      lastUpdatedById: userInfo.userId
    };

    return await operation(auditData);
  };
}

/**
 * Hook for updating audit fields in API routes
 */
export async function updateAuditFields(
  recordId: string,
  data: any,
  model: any
) {
  const userInfo = await PrismaAudit.getCurrentUserInfo();
  
  return await model.update({
    where: { id: recordId },
    data: {
      ...data,
      lastUpdatedBy: userInfo.userName,
      lastUpdatedById: userInfo.userId
    }
  });
}
