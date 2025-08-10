import { logger } from './logger';
import { DatabaseLog } from './types';

/**
 * Simple database logging utilities that focus on essential operations
 */
export class DatabaseLogger {
  
  // Operations that are significant and should always be logged
  private static readonly SIGNIFICANT_OPERATIONS = new Set([
    'create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany', 'executeRaw', 'queryRaw'
    // Log all write operations: create, update, upsert, delete
  ]);

  // Tables that should not be logged (too noisy)
  private static readonly EXCLUDED_TABLES = new Set([
    'Notification', // Only exclude truly noisy tables
    'User' // Exclude user table operations
  ]);

  // Deduplication cache to prevent duplicate logs for the same operation
  private static readonly recentLogs = new Map<string, number>();
  private static readonly DEDUP_WINDOW = 1000; // 1 second window

  /**
   * Create a unique key for deduplication
   */
  private static createDedupKey(operation: Partial<DatabaseLog>): string {
    const { operation: op, table, recordId, query } = operation;
    
    // For updates, be more specific to catch exact duplicates
    if (op === 'update' && recordId) {
      return `${op}-${table}-${recordId}`;
    }
    
    // For other operations, include more context
    return `${op}-${table}-${recordId || 'no-id'}-${query?.slice(0, 50) || 'no-query'}`;
  }

  /**
   * Check if this operation should be deduplicated
   */
  private static shouldDedup(operation: Partial<DatabaseLog>): boolean {
    const key = this.createDedupKey(operation);
    const now = Date.now();
    const lastLogTime = this.recentLogs.get(key);
    
    if (lastLogTime && (now - lastLogTime) < this.DEDUP_WINDOW) {
      return true; // Skip this log (duplicate within window)
    }
    
    // Update the timestamp for this operation
    this.recentLogs.set(key, now);
    
    // Clean up old entries (older than 5 seconds)
    if (this.recentLogs.size > 100) { // Prevent memory leaks
      for (const [oldKey, oldTime] of this.recentLogs.entries()) {
        if (now - oldTime > 5000) {
          this.recentLogs.delete(oldKey);
        }
      }
    }
    
    return false;
  }

  /**
   * Create a simple query summary
   */
  private static createQuerySummary(action: string, model: string, args: any): string {
    return `${action} on ${model}`;
  }

  /**
   * Log a database query with intelligent filtering
   */
  static logQuery(operation: Partial<DatabaseLog>): void {
    // Skip logging routine read operations to reduce noise
    if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(operation.operation || '')) {
      return;
    }

    // Skip logging excluded tables
    if (operation.table && this.EXCLUDED_TABLES.has(operation.table)) {
      return;
    }

    // Only log significant operations (create, upsert, delete, etc.)
    if (!operation.operation || !this.SIGNIFICANT_OPERATIONS.has(operation.operation)) {
      return;
    }

    const summary = this.createQuerySummary(
      operation.operation || '',
      operation.table || '',
      operation.query ? JSON.parse(operation.query) : {}
    );

    logger.logDatabaseOperation({
      ...operation,
      operation: operation.operation || 'QUERY',
      query: summary, // Use summary instead of raw JSON
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log successful database operations (filtered by significance)
   */
  static logSuccess(operation: Partial<DatabaseLog>): void {
    // Skip logging routine read operations to reduce noise
    if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(operation.operation || '')) {
      return;
    }

    // Skip logging excluded tables
    if (operation.table && this.EXCLUDED_TABLES.has(operation.table)) {
      return;
    }

    // Only log significant operations (create, upsert, delete, etc.)
    if (!operation.operation || !this.SIGNIFICANT_OPERATIONS.has(operation.operation)) {
      return;
    }

    // Check for deduplication
    if (this.shouldDedup(operation)) {
      // Log when we skip duplicates (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔇 Skipping duplicate log for: ${operation.operation} on ${operation.table} (${operation.recordId})`);
      }
      return; // Skip duplicate log
    }

    const summary = this.createQuerySummary(
      operation.operation || '',
      operation.table || '',
      operation.query ? JSON.parse(operation.query) : {}
    );

    logger.logDatabaseOperation({
      ...operation,
      operation: operation.operation || 'SUCCESS',
      query: summary, // Use summary instead of raw JSON
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log failed database operations (always logged for debugging)
   */
  static logFailure(operation: Partial<DatabaseLog>, error: Error): void {
    // Skip logging routine read operations to reduce noise
    if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(operation.operation || '')) {
      return;
    }

    // Skip logging excluded tables
    if (operation.table && this.EXCLUDED_TABLES.has(operation.table)) {
      return;
    }

    // Only log significant operations (create, upsert, delete, etc.)
    if (!operation.operation || !this.SIGNIFICANT_OPERATIONS.has(operation.operation)) {
      return;
    }

    const summary = this.createQuerySummary(
      operation.operation || '',
      operation.table || '',
      operation.query ? JSON.parse(operation.query) : {}
    );

    logger.logDatabaseOperation({
      ...operation,
      operation: operation.operation || 'FAILURE',
      query: summary, // Use summary instead of raw JSON
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log transaction start
   */
  static logTransactionStart(transactionId: string, operation: Partial<DatabaseLog>): void {
    logger.logDatabaseOperation({
      ...operation,
      operation: 'TRANSACTION_START',
      query: `Transaction ${transactionId} started`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log transaction commit
   */
  static logTransactionCommit(transactionId: string, operation: Partial<DatabaseLog>): void {
    logger.logDatabaseOperation({
      ...operation,
      operation: 'TRANSACTION_COMMIT',
      query: `Transaction ${transactionId} committed`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log transaction rollback
   */
  static logTransactionRollback(transactionId: string, operation: Partial<DatabaseLog>, reason?: string): void {
    logger.logDatabaseOperation({
      ...operation,
      operation: 'TRANSACTION_ROLLBACK',
      query: `Transaction ${transactionId} rolled back${reason ? `: ${reason}` : ''}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log database migration
   */
  static logMigration(migrationName: string, operation: Partial<DatabaseLog>): void {
    logger.logDatabaseOperation({
      ...operation,
      operation: 'MIGRATION',
      query: `Migration: ${migrationName}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log database backup
   */
  static logBackup(backupType: string, operation: Partial<DatabaseLog>): void {
    logger.logDatabaseOperation({
      ...operation,
      operation: 'BACKUP',
      query: `Backup: ${backupType}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log database restore
   */
  static logRestore(restoreType: string, operation: Partial<DatabaseLog>): void {
    logger.logDatabaseOperation({
      ...operation,
      operation: 'RESTORE',
      query: `Restore: ${restoreType}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log database connection events
   */
  static logConnection(event: 'CONNECT' | 'DISCONNECT' | 'RECONNECT', operation: Partial<DatabaseLog>): void {
    logger.logDatabaseOperation({
      ...operation,
      operation: 'CONNECTION',
      query: `Database ${event.toLowerCase()}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log performance metrics (only if significant)
   */
  static logPerformance(metric: string, value: number, unit: string, operation: Partial<DatabaseLog>): void {
    // Only log if performance is concerning (> 1000ms) or indicates error
    if (value <= 1000 && unit === 'ms') {
      return;
    }

    logger.logDatabaseOperation({
      ...operation,
      operation: 'PERFORMANCE',
      query: `${metric}: ${value}${unit}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log schema changes
   */
  static logSchemaChange(changeType: string, table: string, operation: Partial<DatabaseLog>): void {
    logger.logDatabaseOperation({
      ...operation,
      operation: 'SCHEMA_CHANGE',
      table,
      query: `Schema change: ${changeType} on ${table}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log index operations
   */
  static logIndexOperation(indexAction: string, table: string, indexName: string, operation: Partial<DatabaseLog>): void {
    logger.logDatabaseOperation({
      ...operation,
      operation: 'INDEX_OPERATION',
      table,
      query: `Index ${indexAction}: ${indexName} on ${table}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log constraint operations
   */
  static logConstraintOperation(constraintAction: string, table: string, constraintName: string, operation: Partial<DatabaseLog>): void {
    logger.logDatabaseOperation({
      ...operation,
      operation: 'CONSTRAINT_OPERATION',
      table,
      query: `Constraint ${constraintAction}: ${constraintName} on ${table}`,
      timestamp: new Date().toISOString()
    });
  }
}
