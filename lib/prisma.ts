import { PrismaClient } from '@prisma/client';
import { DatabaseLogger } from './logging/database-logger';
import { RequestContextManager } from './logging/request-context';

// Augment the NodeJS.Global type to include __prisma
// This is the standard way to extend the global object in Node.js
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Add logging middleware
function addLoggingMiddleware(prisma: PrismaClient) {
  // Prevent adding middleware multiple times
  if ((prisma as any)._loggingMiddlewareAdded) {
    return;
  }
  
  // Mark this instance as having middleware
  (prisma as any)._loggingMiddlewareAdded = true;
  
  // Log all queries with intelligent filtering
  prisma.$use(async (params, next) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      // Execute the query first
      const result = await next(params);
      
      // Calculate execution time
      const executionTime = Date.now() - startTime;
      
      // Only log if the operation is significant (filtering is handled by DatabaseLogger)
      DatabaseLogger.logSuccess({
        operation: params.action,
        table: params.model,
        query: JSON.stringify({
          action: params.action,
          model: params.model,
          args: params.args,
          runInTransaction: params.runInTransaction
        }),
        timestamp,
        executionTime,
        affectedRows: getAffectedRows(params, result),
        recordId: getRecordId(params, result)
      });

      return result;
    } catch (error) {
      // Always log failures for debugging
      DatabaseLogger.logFailure({
        operation: params.action,
        table: params.model,
        query: JSON.stringify({
          action: params.action,
          model: params.model,
          args: params.args,
          runInTransaction: params.runInTransaction
        }),
        timestamp
      }, error as Error);
      
      throw error;
    }
  });
}

// Helper function to get affected rows count
function getAffectedRows(params: any, result: any): number | undefined {
  if (params.action === 'create' || params.action === 'createMany') {
    return Array.isArray(result) ? result.length : 1;
  }
  if (params.action === 'update' || params.action === 'updateMany') {
    return Array.isArray(result) ? result.length : 1;
  }
  if (params.action === 'delete' || params.action === 'deleteMany') {
    return Array.isArray(result) ? result.length : 1;
  }
  return undefined;
}

// Helper function to get record ID
function getRecordId(params: any, result: any): string | undefined {
  if (params.action === 'create' && result?.id) {
    return result.id;
  }
  if (params.action === 'update' && result?.id) {
    return result.id;
  }
  if (params.action === 'delete' && result?.id) {
    return result.id;
  }
  if (params.action === 'upsert' && result?.id) {
    return result.id;
  }
  return undefined;
}

// Initialize logging middleware
addLoggingMiddleware(prisma);

export default prisma;