import { DatabaseLogger } from './database-logger';
import { DatabaseLog } from './types';

interface PerformanceThresholds {
  slowQueryThreshold: number; // milliseconds
  criticalQueryThreshold: number; // milliseconds
  logSlowQueries: boolean;
  logAllQueries: boolean;
}

/**
 * Database performance monitoring utility
 */
export class DatabasePerformanceMonitor {
  private static thresholds: PerformanceThresholds = {
    slowQueryThreshold: 1000, // 1 second
    criticalQueryThreshold: 5000, // 5 seconds
    logSlowQueries: true,
    logAllQueries: false
  };

  private static queryStats = new Map<string, {
    count: number;
    totalTime: number;
    minTime: number;
    maxTime: number;
    lastExecuted: Date;
  }>();

  /**
   * Configure performance monitoring thresholds
   */
  static configure(config: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...config };
  }

  /**
   * Start monitoring a database operation
   */
  static startMonitoring(operation: Partial<DatabaseLog>): () => void {
    const startTime = Date.now();
    const operationKey = `${operation.operation}_${operation.table}`;

    // Return a function to call when the operation completes
    return (result?: any, error?: Error) => {
      const executionTime = Date.now() - startTime;
      
      // Update query statistics
      this.updateQueryStats(operationKey, executionTime);
      
      // Log performance metrics
      this.logPerformanceMetrics(operation, executionTime, result, error);
      
      // Check if query is slow or critical
      this.checkQueryPerformance(operation, executionTime);
    };
  }

  /**
   * Update query statistics
   */
  private static updateQueryStats(operationKey: string, executionTime: number): void {
    const stats = this.queryStats.get(operationKey) || {
      count: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      lastExecuted: new Date()
    };

    stats.count++;
    stats.totalTime += executionTime;
    stats.minTime = Math.min(stats.minTime, executionTime);
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.lastExecuted = new Date();

    this.queryStats.set(operationKey, stats);
  }

  /**
   * Log performance metrics
   */
  private static logPerformanceMetrics(
    operation: Partial<DatabaseLog>,
    executionTime: number,
    result?: any,
    error?: Error
  ): void {
    if (!this.thresholds.logAllQueries) return;

    const baseOperation = {
      ...operation,
      executionTime,
      success: !error,
      affectedRows: this.getAffectedRows(result),
      recordId: this.getRecordId(result)
    };

    if (error) {
      DatabaseLogger.logFailure(baseOperation, error);
    } else {
      DatabaseLogger.logSuccess(baseOperation);
    }
  }

  /**
   * Check if query performance meets thresholds
   */
  private static checkQueryPerformance(operation: Partial<DatabaseLog>, executionTime: number): void {
    if (!this.thresholds.logSlowQueries) return;

    if (executionTime >= this.thresholds.criticalQueryThreshold) {
      // Log critical performance issue
      DatabaseLogger.logPerformance('CRITICAL_QUERY_TIME', executionTime, 'ms', {
        ...operation,
        context: {
          performanceLevel: 'CRITICAL',
          threshold: this.thresholds.criticalQueryThreshold,
          recommendation: 'Immediate optimization required'
        }
      });
    } else if (executionTime >= this.thresholds.slowQueryThreshold) {
      // Log slow query
      DatabaseLogger.logPerformance('SLOW_QUERY_TIME', executionTime, 'ms', {
        ...operation,
        context: {
          performanceLevel: 'SLOW',
          threshold: this.thresholds.slowQueryThreshold,
          recommendation: 'Consider optimization'
        }
      });
    }
  }

  /**
   * Get performance statistics for all operations
   */
  static getPerformanceStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [operationKey, operationStats] of this.queryStats.entries()) {
      stats[operationKey] = {
        ...operationStats,
        averageTime: operationStats.totalTime / operationStats.count,
        lastExecuted: operationStats.lastExecuted.toISOString()
      };
    }
    
    return stats;
  }

  /**
   * Get performance statistics for a specific operation
   */
  static getOperationStats(operation: string, table: string): any {
    const operationKey = `${operation}_${table}`;
    const stats = this.queryStats.get(operationKey);
    
    if (!stats) return null;
    
    return {
      ...stats,
      averageTime: stats.totalTime / stats.count,
      lastExecuted: stats.lastExecuted.toISOString()
    };
  }

  /**
   * Reset performance statistics
   */
  static resetStats(): void {
    this.queryStats.clear();
  }

  /**
   * Generate performance report
   */
  static generatePerformanceReport(): string {
    const stats = this.getPerformanceStats();
    const reportLines: string[] = [];
    
    reportLines.push('=== DATABASE PERFORMANCE REPORT ===');
    reportLines.push(`Generated: ${new Date().toISOString()}`);
    reportLines.push(`Total Operations Tracked: ${Object.keys(stats).length}`);
    reportLines.push('');
    
    for (const [operationKey, operationStats] of Object.entries(stats)) {
      reportLines.push(`Operation: ${operationKey}`);
      reportLines.push(`  Count: ${operationStats.count}`);
      reportLines.push(`  Average Time: ${operationStats.averageTime.toFixed(2)}ms`);
      reportLines.push(`  Min Time: ${operationStats.minTime}ms`);
      reportLines.push(`  Max Time: ${operationStats.maxTime}ms`);
      reportLines.push(`  Last Executed: ${operationStats.lastExecuted}`);
      reportLines.push('');
    }
    
    return reportLines.join('\n');
  }

  /**
   * Helper function to get affected rows from result
   */
  private static getAffectedRows(result: any): number | undefined {
    if (result && typeof result === 'object') {
      if (result.count !== undefined) return result.count;
      if (Array.isArray(result)) return result.length;
      return 1;
    }
    return undefined;
  }

  /**
   * Helper function to get record ID from result
   */
  private static getRecordId(result: any): string | undefined {
    if (result && typeof result === 'object') {
      const idFields = ['id', 'uuid', 'recordId', 'code'];
      for (const field of idFields) {
        if (result[field] !== undefined) {
          return String(result[field]);
        }
      }
    }
    return undefined;
  }
}

export default DatabasePerformanceMonitor;
