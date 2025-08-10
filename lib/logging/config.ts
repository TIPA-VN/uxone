import { LogConfig, LogLevel } from './types';
import path from 'path';

export const getLogConfig = (): LogConfig => {
  return {
    level: (process.env.LOG_LEVEL as LogLevel) || 'INFO', // Changed back to 'INFO' for important transactions
    directory: process.env.LOG_DIRECTORY || './logs',
    maxFileSize: process.env.LOG_MAX_FILE_SIZE || '100MB',
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '30', 10),
    asyncEnabled: process.env.LOG_ASYNC_ENABLED !== 'false',
    sanitizeSensitive: process.env.LOG_SANITIZE_SENSITIVE !== 'false',
  };
};

export const getLogFilePath = (filename: string): string => {
  const config = getLogConfig();
  return path.join(config.directory, filename);
};

export const sanitizeData = (data: any): any => {
  const config = getLogConfig();
  if (!config.sanitizeSensitive) return data;

  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'authorization',
    'cookie', 'session', 'credential', 'private', 'sensitive'
  ];

  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    for (const key in sanitized) {
      if (sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  return data;
};

export const formatLogEntry = (entry: any): string => {
  // Use local server timezone instead of UTC
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: process.env.TZ || 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const level = entry.level || 'INFO';
  const category = entry.category || 'SYSTEM';
  
  let logLine = `[${timestamp}] [${level}] [${category}]`;
  
  // For database operations, use simplified format
  if (category === 'DATABASE') {
    // Always include operation and table
    if (entry.operation) {
      logLine += ` | OPERATION: ${entry.operation}`;
    }
    
    if (entry.table) {
      logLine += ` | TABLE: ${entry.table}`;
    }
    
    // Include record ID for specific operations
    if (entry.recordId && ['update', 'delete', 'create'].includes(entry.operation)) {
      logLine += ` | RECORD_ID: ${entry.recordId}`;
    }
    
    // Include query summary (simplified)
    if (entry.query) {
      logLine += ` | QUERY: ${entry.query}`;
    }
    
    // Include affected rows for write operations
    if (entry.affectedRows !== undefined && ['update', 'delete', 'create', 'updateMany', 'deleteMany', 'createMany'].includes(entry.operation)) {
      logLine += ` | AFFECTED_ROWS: ${entry.affectedRows}`;
    }
    
    // Include execution time
    if (entry.executionTime !== undefined) {
      logLine += ` | EXECUTION_TIME: ${entry.executionTime}ms`;
    }
    
    return logLine;
  }
  
  // For other log types, keep the existing format
  if (entry.userId) {
    logLine += ` | USER: ${entry.userId}(${entry.userName || 'Unknown'})`;
  }
  
  if (entry.department) {
    logLine += ` | DEPT: ${entry.department}`;
  }
  
  if (entry.role) {
    logLine += ` | ROLE: ${entry.role}`;
  }
  
  if (entry.sessionId) {
    logLine += ` | SESSION: ${entry.sessionId}`;
  }
  
  if (entry.ipAddress) {
    logLine += ` | IP: ${entry.ipAddress}`;
  }
  
  if (entry.action) {
    logLine += ` | ACTION: ${entry.action}`;
  }
  
  if (entry.description) {
    logLine += ` | DETAILS: ${entry.description}`;
  }
  
  // Add specific fields for different log types
  if (entry.formType) {
    logLine += ` | FORM_TYPE: ${entry.formType}`;
  }
  
  if (entry.formId) {
    logLine += ` | FORM_ID: ${entry.formId}`;
  }
  
  if (entry.fields && Array.isArray(entry.fields)) {
    logLine += ` | FIELDS: [${entry.fields.join(', ')}]`;
  }
  
  if (entry.operation) {
    logLine += ` | OPERATION: ${entry.operation}`;
  }
  
  if (entry.table) {
    logLine += ` | TABLE: ${entry.table}`;
  }
  
  if (entry.recordId) {
    logLine += ` | RECORD_ID: ${entry.recordId}`;
  }
  
  if (entry.query) {
    logLine += ` | QUERY: ${entry.query}`;
  }
  
  if (entry.affectedRows !== undefined) {
    logLine += ` | AFFECTED_ROWS: ${entry.affectedRows}`;
  }
  
  if (entry.executionTime !== undefined) {
    logLine += ` | EXECUTION_TIME: ${entry.executionTime}ms`;
  }
  
  if (entry.workflowType) {
    logLine += ` | WORKFLOW_TYPE: ${entry.workflowType}`;
  }
  
  if (entry.workflowId) {
    logLine += ` | WORKFLOW_ID: ${entry.workflowId}`;
  }
  
  if (entry.step) {
    logLine += ` | STEP: ${entry.step}`;
  }
  
  if (entry.previousStatus) {
    logLine += ` | PREV_STATUS: ${entry.previousStatus}`;
  }
  
  if (entry.newStatus) {
    logLine += ` | NEW_STATUS: ${entry.newStatus}`;
  }
  
  if (entry.comments) {
    logLine += ` | COMMENTS: ${entry.comments}`;
  }
  
  if (entry.nextAssignee) {
    logLine += ` | NEXT_ASSIGNEE: ${entry.nextAssignee}`;
  }
  
  if (entry.event) {
    logLine += ` | EVENT: ${entry.event}`;
  }
  
  if (entry.success !== undefined) {
    logLine += ` | SUCCESS: ${entry.success}`;
  }
  
  if (entry.failureReason) {
    logLine += ` | FAILURE_REASON: ${entry.failureReason}`;
  }
  
  if (entry.targetResource) {
    logLine += ` | TARGET_RESOURCE: ${entry.targetResource}`;
  }
  
  if (entry.errorType) {
    logLine += ` | ERROR_TYPE: ${entry.errorType}`;
  }
  
  if (entry.errorMessage) {
    logLine += ` | ERROR_MESSAGE: ${entry.errorMessage}`;
  }
  
  if (entry.context && typeof entry.context === 'object') {
    const contextStr = JSON.stringify(entry.context);
    logLine += ` | CONTEXT: ${contextStr}`;
  }
  
  return logLine;
};
