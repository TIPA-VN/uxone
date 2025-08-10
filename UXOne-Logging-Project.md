# UXOne Logging Architecture & Implementation Plan

## 🎯 Overview

A comprehensive logging system for UXOne that captures all user actions related to forms, database operations, and workflows in plain text format with centralized log file management.

## 📋 Log Categories & Files

### Main Log Files Structure
```
logs/
├── user-actions.log          # All user form interactions
├── database-operations.log   # CRUD operations on all entities
├── workflow-activities.log   # Process flows (approvals, status changes)
├── authentication.log        # Login/logout activities
└── system-errors.log        # Error tracking and debugging
```

## 🏗️ Architecture Components

### 1. Logging Service Layer
```typescript
// lib/logging/logger.ts
class UXOneLogger {
  private writeToFile(filename: string, entry: LogEntry): void
  public logUserAction(action: UserActionLog): void
  public logDatabaseOperation(operation: DatabaseLog): void
  public logWorkflowActivity(workflow: WorkflowLog): void
  public logAuthentication(auth: AuthLog): void
  public logError(error: ErrorLog): void
}
```

### 2. Log Entry Structure
```typescript
interface BaseLogEntry {
  timestamp: string;           // ISO 8601 format
  sessionId: string;          // Unique session identifier
  userId: string;             // Employee code (emp_code)
  userName: string;           // Full name
  department: string;         // User's department
  role: string;               // User's role
  ipAddress: string;          // Client IP
  userAgent: string;          // Browser/client info
}

interface UserActionLog extends BaseLogEntry {
  action: string;             // "CREATE", "UPDATE", "DELETE", "VIEW"
  formType: string;           // "Project", "Task", "Document", etc.
  formId?: string;            // Record ID if applicable
  fields: string[];           // Fields modified
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description: string;        // Human-readable action description
}

interface DatabaseLog extends BaseLogEntry {
  operation: string;          // "INSERT", "UPDATE", "DELETE", "SELECT"
  table: string;              // Database table name
  recordId?: string;          // Primary key value
  query: string;              // Sanitized query (no sensitive data)
  affectedRows: number;       // Number of rows affected
  executionTime: number;      // Query execution time in ms
}

interface WorkflowLog extends BaseLogEntry {
  workflowType: string;       // "ProjectApproval", "TaskAssignment", etc.
  workflowId: string;         // Workflow instance ID
  step: string;               // Current workflow step
  action: string;             // "APPROVE", "REJECT", "ASSIGN", "COMPLETE"
  previousStatus: string;     // Previous state
  newStatus: string;          // New state
  comments?: string;          // User comments
  nextAssignee?: string;      // Next person in workflow
}
```

## 🔧 Implementation Strategy

### Phase 1: Core Infrastructure (Week 1-2)
1. **Set up logging service**
   - Create logging utility classes
   - Implement file writing mechanisms
   - Add log rotation for large files
   - Configure log directory structure

2. **Middleware Integration**
   - Create Next.js middleware for request logging
   - Integrate with NextAuth for user context
   - Add request/response interceptors

### Phase 2: Database Operation Logging (Week 2-3)
1. **Prisma Integration**
   - Create Prisma middleware for automatic logging
   - Capture all CRUD operations
   - Log query performance metrics
   - Handle bulk operations

2. **Manual Database Logging**
   - Add logging to direct SQL queries
   - JDE integration logging
   - External API database calls

### Phase 3: Form Action Logging (Week 3-4)
1. **React Hook Integration**
   - Create custom hooks for form logging
   - Auto-capture form submissions
   - Track field-level changes
   - Handle validation errors

2. **Component Enhancement**
   - Add logging to existing forms
   - Project management forms
   - Task management forms
   - Document upload forms
   - User management forms

### Phase 4: Workflow Logging (Week 4-5)
1. **Process Flow Tracking**
   - Project approval workflows
   - Task assignment processes
   - Document approval flows
   - Helpdesk ticket workflows

2. **Status Change Monitoring**
   - All status transitions
   - Approval/rejection actions
   - Assignment changes
   - Progress updates

## 📝 Log Format Specification

### Plain Text Format
```
[TIMESTAMP] [LOG_LEVEL] [CATEGORY] | USER: emp_code(full_name) | DEPT: department | ROLE: role | SESSION: session_id | IP: ip_address | ACTION: description | DETAILS: {key:value, key:value}
```

### Example Log Entries
```
# User Action Log
[2024-12-10T14:30:15.123Z] [INFO] [USER_ACTION] | USER: EMP001(John Doe) | DEPT: IS | ROLE: ADMIN | SESSION: sess_abc123 | IP: 10.116.2.100 | ACTION: Created new project | DETAILS: {form:Project, id:PROJ_001, name:"Website Redesign", status:PLANNING}

# Database Operation Log
[2024-12-10T14:30:15.456Z] [INFO] [DATABASE] | USER: EMP001(John Doe) | DEPT: IS | ROLE: ADMIN | SESSION: sess_abc123 | IP: 10.116.2.100 | ACTION: INSERT into projects table | DETAILS: {table:projects, id:PROJ_001, execution_time:45ms, affected_rows:1}

# Workflow Activity Log
[2024-12-10T14:35:22.789Z] [INFO] [WORKFLOW] | USER: EMP002(Jane Smith) | DEPT: PM | ROLE: MANAGER | SESSION: sess_def456 | IP: 10.116.2.101 | ACTION: Approved project proposal | DETAILS: {workflow:ProjectApproval, id:PROJ_001, previous_status:PENDING, new_status:APPROVED, comments:"Budget approved"}
```

## 🔌 Integration Points

### 1. API Route Middleware
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Log all API requests
  // Capture user context
  // Track request/response data
}
```

### 2. Prisma Middleware
```typescript
// lib/prisma.ts
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  // Log database operation
  logger.logDatabaseOperation({
    operation: params.action,
    table: params.model,
    executionTime: after - before,
    // ... other details
  });
  
  return result;
});
```

### 3. Form Hook Integration
```typescript
// hooks/useFormLogger.ts
export function useFormLogger(formType: string) {
  const logFormAction = (action: string, data: any) => {
    logger.logUserAction({
      action,
      formType,
      // ... capture form details
    });
  };
  
  return { logFormAction };
}
```

## 📊 Log Management Features

### 1. File Rotation
- Maximum file size: 100MB per log file
- Keep last 30 days of logs
- Compress older logs
- Archive monthly logs

### 2. Performance Considerations
- Asynchronous logging (non-blocking)
- Batch writing for high-volume operations
- Configurable log levels
- Memory-efficient streaming

### 3. Security & Privacy
- Sanitize sensitive data (passwords, tokens)
- Hash personally identifiable information
- Secure log file permissions
- Log file access controls

## 🛠️ Configuration

### Environment Variables
```env
# Logging Configuration
LOG_LEVEL=INFO                    # DEBUG, INFO, WARN, ERROR
LOG_DIRECTORY=./logs             # Log files directory
LOG_MAX_FILE_SIZE=100MB          # Maximum file size before rotation
LOG_RETENTION_DAYS=30            # Days to keep logs
LOG_ASYNC_ENABLED=true           # Enable async logging
LOG_SANITIZE_SENSITIVE=true     # Remove sensitive data
```

### Log Level Configuration
- **DEBUG**: Detailed debugging information
- **INFO**: General information and user actions
- **WARN**: Warning conditions
- **ERROR**: Error conditions requiring attention

## 🎛️ Monitoring & Maintenance

### 1. Log Analysis Tools
- Basic grep/awk scripts for log searching
- Custom dashboard for log visualization
- Automated log parsing utilities
- Performance monitoring scripts

### 2. Alerting System
- Critical error notifications
- Unusual activity detection
- Disk space monitoring
- Log file corruption alerts

### 3. Maintenance Tasks
- Daily log rotation checks
- Weekly log analysis reports
- Monthly archive procedures
- Quarterly cleanup processes

## 📈 Benefits & Use Cases

### 1. Audit Trail
- Complete user action history
- Compliance reporting
- Data change tracking
- Security monitoring

### 2. Debugging & Support
- Issue reproduction assistance
- Performance bottleneck identification
- User behavior analysis
- System health monitoring

### 3. Business Intelligence
- User activity patterns
- Feature usage statistics
- Workflow efficiency analysis
- System utilization metrics

## 🚀 Implementation Timeline

- **Week 1**: Core logging infrastructure
- **Week 2**: Database operation logging
- **Week 3**: Form action logging
- **Week 4**: Workflow activity logging
- **Week 5**: Testing and optimization
- **Week 6**: Documentation and training

## 🔧 Technical Requirements

### Dependencies
```json
{
  "winston": "^3.8.0",          // Structured logging
  "winston-daily-rotate-file": "^4.7.0",  // Log rotation
  "cls-hooked": "^4.2.2"        // Request context tracking
}
```

### File System Requirements
- Minimum 10GB disk space for logs
- Write permissions on log directory
- Log rotation monitoring
- Backup capabilities

This architecture provides a comprehensive, scalable logging solution that captures all user interactions while maintaining performance and security standards for the UXOne enterprise system.