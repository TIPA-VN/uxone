export interface BaseLogEntry {
  timestamp: string;           // ISO 8601 format
  sessionId: string;          // Unique session identifier
  userId: string;             // Employee code (emp_code)
  userName: string;           // Full name
  department: string;         // User's department
  role: string;               // User's role
  ipAddress: string;          // Client IP
  userAgent: string;          // Browser/client info
}

export interface UserActionLog extends BaseLogEntry {
  action: string;             // "CREATE", "UPDATE", "DELETE", "VIEW"
  formType: string;           // "Project", "Task", "Document", etc.
  formId?: string;            // Record ID if applicable
  fields: string[];           // Fields modified
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description: string;        // Human-readable action description
}

export interface DatabaseLog extends BaseLogEntry {
  operation: string;          // "INSERT", "UPDATE", "DELETE", "SELECT"
  table: string;              // Database table name
  recordId?: string;          // Primary key value
  query: string;              // Sanitized query (no sensitive data)
  affectedRows: number;       // Number of rows affected
  executionTime: number;      // Query execution time in ms
}

export interface WorkflowLog extends BaseLogEntry {
  workflowType: string;       // "ProjectApproval", "TaskAssignment", etc.
  workflowId: string;         // Workflow instance ID
  step: string;               // Current workflow step
  action: string;             // "APPROVE", "REJECT", "ASSIGN", "COMPLETE"
  previousStatus: string;     // Previous state
  newStatus: string;          // New state
  comments?: string;          // User comments
  nextAssignee?: string;      // Next person in workflow
}

export interface AuthLog extends BaseLogEntry {
  event: string;              // "LOGIN", "LOGOUT", "SESSION_EXPIRED", "ACCESS_DENIED"
  success: boolean;           // Whether the operation was successful
  failureReason?: string;     // Reason for failure if applicable
  targetResource?: string;    // Resource being accessed
}

export interface ErrorLog extends BaseLogEntry {
  errorType: string;          // "VALIDATION_ERROR", "DATABASE_ERROR", "AUTH_ERROR", "SYSTEM_ERROR"
  errorMessage: string;       // Error message
  stackTrace?: string;        // Stack trace for debugging
  context?: Record<string, any>; // Additional context information
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogConfig {
  level: LogLevel;
  directory: string;
  maxFileSize: string;
  retentionDays: number;
  asyncEnabled: boolean;
  sanitizeSensitive: boolean;
}
