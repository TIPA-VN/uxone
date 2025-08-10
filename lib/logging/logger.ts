import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { 
  BaseLogEntry, 
  UserActionLog, 
  DatabaseLog, 
  WorkflowLog, 
  AuthLog, 
  ErrorLog,
  LogLevel 
} from './types';
import { getLogConfig, getLogFilePath, sanitizeData, formatLogEntry } from './config';

class UXOneLogger {
  private userActionLogger!: winston.Logger;
  private databaseLogger!: winston.Logger;
  private workflowLogger!: winston.Logger;
  private authLogger!: winston.Logger;
  private errorLogger!: winston.Logger;
  private consoleLogger!: winston.Logger;
  private config = getLogConfig();

  constructor() {
    this.initializeLoggers();
  }

  private initializeLoggers(): void {
    const { level, directory, maxFileSize, retentionDays } = this.config;

    // Common transport configuration
    const createRotateTransport = (filename: string) => {
      return new DailyRotateFile({
        filename: getLogFilePath(filename),
        datePattern: 'YYYY-MM-DD',
        maxSize: maxFileSize,
        maxFiles: `${retentionDays}d`,
        level: level.toLowerCase(),
        format: winston.format.combine(
          winston.format.printf(({ level, message }) => {
            return `${message}`;
          })
        )
      });
    };

    // Console transport for development
    const consoleTransport = new winston.transports.Console({
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn', // Changed from 'info' to 'warn'
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message }) => {
          return `${message}`;
        })
      )
    });

    // User Actions Logger
    this.userActionLogger = winston.createLogger({
      level: level.toLowerCase(),
      format: winston.format.combine(
        winston.format.errors({ stack: true })
      ),
      transports: [
        createRotateTransport('user-actions.log'),
        consoleTransport
      ]
    });

    // Database Operations Logger
    this.databaseLogger = winston.createLogger({
      level: level.toLowerCase(),
      format: winston.format.combine(
        winston.format.errors({ stack: true })
      ),
      transports: [
        createRotateTransport('database-operations.log'),
        consoleTransport
      ]
    });

    // Workflow Activities Logger
    this.workflowLogger = winston.createLogger({
      level: level.toLowerCase(),
      format: winston.format.combine(
        winston.format.errors({ stack: true })
      ),
      transports: [
        createRotateTransport('workflow-activities.log'),
        consoleTransport
      ]
    });

    // Authentication Logger
    this.authLogger = winston.createLogger({
      level: level.toLowerCase(),
      format: winston.format.combine(
        winston.format.errors({ stack: true })
      ),
      transports: [
        createRotateTransport('authentication.log'),
        consoleTransport
      ]
    });

    // Error Logger
    this.errorLogger = winston.createLogger({
      level: level.toLowerCase(),
      format: winston.format.combine(
        winston.format.errors({ stack: true })
      ),
      transports: [
        createRotateTransport('system-errors.log'),
        consoleTransport
      ]
    });

    // Console Logger (for general info/warn/debug)
    this.consoleLogger = winston.createLogger({
      level: level.toLowerCase(),
      format: winston.format.combine(
        winston.format.errors({ stack: true })
      ),
      transports: [consoleTransport]
    });

    // Handle uncaught exceptions
    this.errorLogger.exceptions.handle(
      new DailyRotateFile({
        filename: getLogFilePath('exceptions.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: maxFileSize,
        maxFiles: `${retentionDays}d`
      })
    );
  }

  private enrichLogEntry(entry: Partial<BaseLogEntry>): BaseLogEntry {
    return {
      timestamp: new Date().toISOString(),
      sessionId: entry.sessionId || 'unknown',
      userId: entry.userId || 'unknown',
      userName: entry.userName || 'Unknown User',
      department: entry.department || 'unknown',
      role: entry.role || 'unknown',
      ipAddress: entry.ipAddress || 'unknown',
      userAgent: entry.userAgent || 'unknown',
      ...entry
    } as BaseLogEntry;
  }

  public logUserAction(action: Partial<UserActionLog>): void {
    const enrichedEntry = this.enrichLogEntry(action);
    const sanitizedEntry = sanitizeData(enrichedEntry);
    const logMessage = formatLogEntry({
      ...sanitizedEntry,
      level: 'INFO',
      category: 'USER_ACTION'
    });
    
    this.userActionLogger.info(logMessage);
  }

  public logDatabaseOperation(operation: Partial<DatabaseLog>): void {
    const enrichedEntry = this.enrichLogEntry(operation);
    const sanitizedEntry = sanitizeData(enrichedEntry);
    const logMessage = formatLogEntry({
      ...sanitizedEntry,
      level: 'INFO',
      category: 'DATABASE'
    });
    
    this.databaseLogger.info(logMessage);
  }

  public logWorkflowActivity(workflow: Partial<WorkflowLog>): void {
    const enrichedEntry = this.enrichLogEntry(workflow);
    const sanitizedEntry = sanitizeData(enrichedEntry);
    const logMessage = formatLogEntry({
      ...sanitizedEntry,
      level: 'INFO',
      category: 'WORKFLOW'
    });
    
    this.workflowLogger.info(logMessage);
  }

  public logAuthentication(auth: Partial<AuthLog>): void {
    const enrichedEntry = this.enrichLogEntry(auth);
    const sanitizedEntry = sanitizeData(enrichedEntry);
    const logMessage = formatLogEntry({
      ...sanitizedEntry,
      level: 'INFO',
      category: 'AUTHENTICATION'
    });
    
    this.authLogger.info(logMessage);
  }

  public logError(error: Partial<ErrorLog>): void {
    const enrichedEntry = this.enrichLogEntry(error);
    const sanitizedEntry = sanitizeData(enrichedEntry);
    const logMessage = formatLogEntry({
      ...sanitizedEntry,
      level: 'ERROR',
      category: 'ERROR'
    });
    
    this.errorLogger.error(logMessage);
  }

  public logInfo(message: string, meta?: any): void {
    this.consoleLogger.info(message, meta);
  }

  public logWarn(message: string, meta?: any): void {
    this.consoleLogger.warn(message, meta);
  }

  public logDebug(message: string, meta?: any): void {
    this.consoleLogger.debug(message, meta);
  }

  // Method to get logger instances for advanced usage
  public getUserActionLogger(): winston.Logger {
    return this.userActionLogger;
  }

  public getDatabaseLogger(): winston.Logger {
    return this.databaseLogger;
  }

  public getWorkflowLogger(): winston.Logger {
    return this.workflowLogger;
  }

  public getAuthLogger(): winston.Logger {
    return this.authLogger;
  }

  public getErrorLogger(): winston.Logger {
    return this.errorLogger;
  }
}

// Create singleton instance
export const logger = new UXOneLogger();

// Export the class for testing or custom instances
export { UXOneLogger };
